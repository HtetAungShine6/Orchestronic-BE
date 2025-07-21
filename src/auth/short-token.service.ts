import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class ShortTokenService {
  constructor(
    private jwtService: JwtService,
    private databaseService: DatabaseService,
  ) {}

  async createTokens(user: {
    id: string;
    email: string;
    role: string;
    name: string;
  }): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '1h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    // Save to DB
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);

    await this.databaseService.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: expiry,
      },
    });

    return { accessToken, refreshToken };
  }
}
