import { IsBoolean } from 'class-validator';

export class BanUserDto {
  @IsBoolean()
  isBanned: boolean;
}
