import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { JwtPayload } from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email đã được sử dụng');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create(dto.email, passwordHash);
    const { passwordHash: _, ...result } = user;
    return result;
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const matched = await bcrypt.compare(password, user.passwordHash);
    if (!matched) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    if (user.isBanned) {
      throw new UnauthorizedException('Tài khoản của bạn đã bị ban');
    }

    return user;
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    const accessToken = await this.createAccessToken(user);
    const refreshToken = await this.createRefreshToken(user);
    return {
      accessToken,
      refreshToken,
      refreshTokenMaxAge: this.getRefreshTokenMaxAge(),
    };
  }

  async createAccessToken(user: User) {
    const secret =
      this.configService.get<string>('JWT_ACCESS_SECRET') ?? 'dev_access_secret';
    const expiresIn =
      this.configService.get<string>('JWT_ACCESS_EXPIRES') ?? '15m';

    return this.jwtService.signAsync(
      {
        sub: String(user.id),
        email: user.email,
        role: user.role,
      } as Record<string, unknown>,
      {
        secret,
        expiresIn: expiresIn as any,
      },
    );
  }

  async createRefreshToken(user: User) {
    const secret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ?? 'dev_refresh_secret';
    const expiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES') ?? '7d';

    return this.jwtService.signAsync(
      {
        sub: String(user.id),
        email: user.email,
        role: user.role,
        type: 'refresh',
      } as Record<string, unknown>,
      {
        secret,
        expiresIn: expiresIn as any,
      },
    );
  }

  getRefreshTokenMaxAge(): number {
    const expires =
      this.configService.get<string>('JWT_REFRESH_EXPIRES') ?? '7d';
    return this.parseExpiration(expires);
  }

  private parseExpiration(value: string): number {
    const normalized = value.trim().toLowerCase();
    const numberValue = Number(normalized);

    if (!Number.isNaN(numberValue)) {
      return numberValue * 1000;
    }

    const matches = normalized.match(/^([0-9]+)([smhd])$/);
    if (!matches) {
      return 7 * 24 * 60 * 60 * 1000;
    }

    const amount = Number(matches[1]);
    const unit = matches[2];

    switch (unit) {
      case 's':
        return amount * 1000;
      case 'm':
        return amount * 60 * 1000;
      case 'h':
        return amount * 60 * 60 * 1000;
      case 'd':
        return amount * 24 * 60 * 60 * 1000;
      default:
        return amount * 1000;
    }
  }
}

