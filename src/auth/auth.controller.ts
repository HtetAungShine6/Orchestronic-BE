import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { BackendJwtPayload, RequestWithCookies } from 'src/lib/types';
import * as jwt from 'jsonwebtoken';
import { CookieOptions } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private jwt: JwtService) {}

  private buildCookieOptions(maxAge: number): CookieOptions {
    const isSecureEnv =
      process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
    const cookieDomain = process.env.COOKIE_DOMAIN?.trim();

    return {
      httpOnly: true,
      secure: isSecureEnv,
      sameSite: isSecureEnv ? 'none' : 'lax',
      path: '/',
      maxAge,
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    };
  }

  @Get('test-login')
  testLogin(@Res() res: Response) {
    const accessToken = this.jwt.sign(
      { sub: '123', role: 'Admin' },
      { expiresIn: '1h' },
    );
    const refreshToken = this.jwt.sign({ sub: '123' }, { expiresIn: '7d' });

    res.cookie('access_token', accessToken, {
      ...this.buildCookieOptions(60 * 60 * 1000),
    });

    res.cookie('refresh_token', refreshToken, {
      ...this.buildCookieOptions(7 * 24 * 60 * 60 * 1000),
    });

    return res.json({ message: 'Cookies set' });
  }

  @Get('azure')
  @UseGuards(AuthGuard('azure-ad'))
  async azureLogin() {
    // passport redirect to Azure
  }

  @Get('azure/callback')
  @UseGuards(AuthGuard('azure-ad'))
  azureCallback(@Req() req, @Res() res: Response) {
    console.log('Req.user:', req.user);
    const user = req.user;

    // Issue short-lived JWT
    // Issue short-lived access token
    const accessToken = this.jwt.sign(user, { expiresIn: '1h' });

    // Issue refresh token (store in DB or cache with expiration)
    const refreshToken = this.jwt.sign({ id: user.id }, { expiresIn: '7d' });

    // Save tokens in HTTP-only cookies
    res.cookie('access_token', accessToken, {
      ...this.buildCookieOptions(60 * 60 * 1000),
    });

    res.cookie('refresh_token', refreshToken, {
      ...this.buildCookieOptions(7 * 24 * 60 * 60 * 1000),
    });

    // Redirect to frontend
    return res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  }

  @Post('refresh')
  refresh(@Req() req: RequestWithCookies, @Res() res: Response) {
    const refreshToken = req.cookies['refresh_token'];

    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not defined');
    }

    try {
      const decoded = jwt.verify(refreshToken, secret) as unknown;
      const payload = decoded as BackendJwtPayload;

      // Issue new short-lived access token
      const accessToken = this.jwt.sign(
        { id: payload.id },
        { expiresIn: '1h' },
      );

      res.cookie('access_token', accessToken, {
        ...this.buildCookieOptions(60 * 60 * 1000),
      });

      return res.json({ accessToken });
    } catch {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    const isSecureEnv =
      process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
    const cookieDomain = process.env.COOKIE_DOMAIN?.trim();

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: isSecureEnv,
      sameSite: isSecureEnv ? 'none' : 'lax',
      path: '/',
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    });
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: isSecureEnv,
      sameSite: isSecureEnv ? 'none' : 'lax',
      path: '/',
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    });
    return { message: 'Logged out' };
  }
}
