import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AuthRefreshDto {
  @ApiProperty({
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
