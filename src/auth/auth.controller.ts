// auth.controller.ts
import {
  Controller,
  Post,
  Body,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { AzureTokenService } from './azure-token.service';
import { ShortTokenService } from './short-token.service';
import { UserService } from '../user/user.service';
import { AuthExchangeDto } from './dto/auth-exchange.dto';
import { Public } from './public.decorator';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from 'src/database/database.service';
import { CustomJWTPayload } from 'src/lib/types';
import { Cron } from '@nestjs/schedule';
import { AuthRefreshDto } from './dto/auth-refresh.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private azureTokenService: AzureTokenService,
    private shortTokenService: ShortTokenService,
    private userService: UserService,
    private jwtService: JwtService,
    private databaseService: DatabaseService,
  ) {}

  @Public()
  @Post('exchange')
  async exchangeToken(@Body() authDto: AuthExchangeDto) {
    if (!authDto) throw new BadRequestException('Azure token is required');

    const payload = await this.azureTokenService.verifyAzureToken(
      authDto.azureToken,
    );

    if (!payload) {
      throw new BadRequestException('Invalid Azure token');
    }

    // Extract user info from Azure token payload
    const userId = payload.oid;
    const email = payload.email || payload.upn;

    if (!userId || !email) {
      throw new BadRequestException('Invalid Azure token payload');
    }

    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Create your own short token with minimal info
    const shortToken = await this.shortTokenService.createTokens({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return {
      accessToken: shortToken.accessToken,
      refreshToken: shortToken.refreshToken,
    };
  }

  @Public()
  @Post('refresh')
  async refresh(@Body() authDto: AuthRefreshDto) {
    const oldToken = authDto.refreshToken;

    let payload: CustomJWTPayload;
    try {
      payload = this.jwtService.verify(oldToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const existing = await this.databaseService.refreshToken.findFirst({
      where: {
        token: oldToken,
        userId: payload.id,
      },
    });

    if (!existing) throw new UnauthorizedException('Token not found or reused');

    // Delete old token (rotation step)
    await this.databaseService.refreshToken.deleteMany({
      where: {
        token: oldToken,
      },
    });

    const user = await this.userService.findByEmail(payload.email ?? '');
    if (!user) throw new UnauthorizedException('User not found');

    // Issue new access + refresh token
    const tokens = await this.shortTokenService.createTokens(user);

    return tokens;
  }

  @Cron('0 0 * * *')
  async deleteExpiredTokens() {
    await this.databaseService.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}
