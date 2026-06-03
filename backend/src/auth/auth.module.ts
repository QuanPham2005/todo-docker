import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { RolesGuard } from './guards/roles.guard';
import { BanCheckGuard } from './guards/ban-check.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refresh.strategy';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User]),
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt', session: false }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const expiresIn =
          config.get<string>('JWT_ACCESS_EXPIRES') ?? '15m';
        return {
          secret: config.get<string>('JWT_ACCESS_SECRET') ?? 'dev_access_secret',
          signOptions: {
            expiresIn: expiresIn as any,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    RefreshTokenStrategy,
    JwtAuthGuard,
    RefreshTokenGuard,
    RolesGuard,
    BanCheckGuard,
  ],
  exports: [AuthService],
})
export class AuthModule {}

