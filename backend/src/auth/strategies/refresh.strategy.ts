import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { User } from '../../users/entities/user.entity';

const cookieExtractor = (req: any): string | null => {
  if (req && req.cookies) {
    return req.cookies['refresh_token'];
  }
  return null;
};

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      ignoreExpiration: false,
      passReqToCallback: true,
      secretOrKey:
        configService.get<string>('JWT_REFRESH_SECRET') ?? 'dev_refresh_secret',
    });
  }

  async validate(
    request: any,
    payload: { sub: number; email: string; role: string; type: string },
  ): Promise<User> {
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    if (user.isBanned) {
      throw new UnauthorizedException('Tài khoản đã bị ban');
    }

    return user;
  }
}
