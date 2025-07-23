import {
  Controller,
  Post,
  Body,
  BadRequestException,
  UnauthorizedException,
  Res,
} from '@nestjs/common';
import { AzureTokenService } from './azure-token.service';
import { ShortTokenService } from './short-token.service';
import { UserService } from '../user/user.service';
import {
  AuthExchangeDto,
  AuthExchangeResponseDto,
} from './dto/auth-exchange.dto';
import { Public } from './public.decorator';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from 'src/database/database.service';
import { CustomJWTPayload } from 'src/lib/types';
import { Cron } from '@nestjs/schedule';
import { AuthRefreshDto, AuthRefreshResponseDto } from './dto/auth-refresh.dto';
import { Response } from 'express';
import { VerifyTokenDto } from './dto/verify-token.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Authentication')
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
  @ApiOperation({
    summary: 'Exchange Azure AD token for backend tokens',
    description:
      'Exchanges a valid Azure AD token for backend access and refresh tokens',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully exchanged tokens',
    type: AuthExchangeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid Azure token or user not found',
  })
  async exchangeToken(
    @Body() authDto: AuthExchangeDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthExchangeResponseDto> {
    if (!authDto) throw new BadRequestException('Azure token is required');

    const payload = await this.azureTokenService.verifyAzureToken(
      authDto.azureToken,
    );

    if (!payload) {
      throw new BadRequestException('Invalid Azure token');
    }

    // Extract user info from Azure token payload
    const userId = payload.oid;
    const email = payload.upn;

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
      name: user.name,
      email: user.email,
      role: user.role,
    });

    res.cookie('refresh_token', shortToken.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return {
      accessToken: shortToken.accessToken,
    };
  }

  @Public()
  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Exchange a valid refresh token for new access and refresh tokens',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully refreshed tokens',
    type: AuthRefreshResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
  })
  async refresh(
    @Body() authDto: AuthRefreshDto,
  ): Promise<AuthRefreshResponseDto> {
    const oldToken = authDto.refreshToken;

    let payload: { id: string; iat: number; exp: number };
    try {
      payload = this.jwtService.verify(oldToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new UnauthorizedException(`Invalid refresh token: ${errorMessage}`);
    }

    console.log('Step 1: Refresh token verified successfully', payload);

    const existing = await this.databaseService.refreshToken.findFirst({
      where: {
        token: oldToken,
        userId: payload.id,
      },
    });

    console.log('Step 2: Existing token found:', oldToken);

    console.log('Step 3: Existing token details:', existing);

    if (!existing) throw new UnauthorizedException('Token not found or reused');

    // Delete old token (rotation step)
    await this.databaseService.refreshToken.deleteMany({
      where: {
        token: oldToken,
      },
    });

    const user = await this.userService.findById(payload.id ?? '');
    if (!user) throw new UnauthorizedException('User not found');

    // Issue new access + refresh token
    const tokens = await this.shortTokenService.createTokens(user);

    return tokens;
  }

  @Public()
  @Post('verify')
  verifyToken(@Body() verifyTokenDto: VerifyTokenDto) {
    try {
      const payload = this.jwtService.verify(verifyTokenDto.token, {
        secret: process.env.JWT_REFRESH_SECRET,
      }) as unknown as CustomJWTPayload;
      return { valid: true, payload };
    } catch {
      return { valid: false, error: 'Token expired or invalid' };
    }
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
