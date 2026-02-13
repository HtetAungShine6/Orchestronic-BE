import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { BackendJwtPayload, RequestWithCookies } from '../lib/types';
import * as jwt from 'jsonwebtoken';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private jwt: JwtService,
    private authService: AuthService,
  ) {}

  @Get('test-login')
  testLogin(@Res() res: Response) {
    const isProd = process.env.NODE_ENV === 'production';
    const accessToken = this.jwt.sign(
      { sub: '123', role: 'Admin' },
      { expiresIn: '1h' },
    );
    const refreshToken = this.jwt.sign({ sub: '123' }, { expiresIn: '7d' });

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProd, // for Postman / localhost
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 60 * 60 * 1000,
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ message: 'Cookies set' });
  }

  @Get('azure')
  async azureLogin(@Res() res: Response) {
    console.log('🚀 Azure login initiated');

    // Generate state and sign it
    const state = this.authService.generateState();
    const stateSig = this.authService.signState(state);

    // Store state in a short-lived cookie (survives serverless invocations)
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('oauth_state', state, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 5 * 60 * 1000, // 5 minutes
      path: '/',
    });
    res.cookie('oauth_state_sig', stateSig, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 5 * 60 * 1000,
      path: '/',
    });

    const authUrl = this.authService.getAuthorizationUrl(state);
    console.log('Redirecting to Azure AD:', authUrl.substring(0, 100) + '...');
    return res.redirect(authUrl);
  }

  @Get('azure/callback')
  async azureCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Query('error_description') errorDescription: string,
    @Req() req,
    @Res() res: Response,
  ) {
    console.log('🔙 Azure callback received');
    const isProd = process.env.NODE_ENV === 'production';

    // Clear the state cookies
    const cookieClearOpts = {
      httpOnly: true,
      secure: isProd,
      sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
      path: '/',
    };

    try {
      // Check for Azure AD errors
      if (error) {
        console.error('Azure AD error:', error, errorDescription);
        res.clearCookie('oauth_state', cookieClearOpts);
        res.clearCookie('oauth_state_sig', cookieClearOpts);
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=${error}`);
      }

      // Verify state to prevent CSRF
      const savedState = req.cookies?.oauth_state;
      const savedStateSig = req.cookies?.oauth_state_sig;

      if (!savedState || !savedStateSig) {
        console.error('No state cookie found');
        return res.redirect(
          `${process.env.FRONTEND_URL}/login?error=missing_state`,
        );
      }

      if (
        state !== savedState ||
        !this.authService.verifyState(savedState, savedStateSig)
      ) {
        console.error('State mismatch or invalid signature');
        res.clearCookie('oauth_state', cookieClearOpts);
        res.clearCookie('oauth_state_sig', cookieClearOpts);
        return res.redirect(
          `${process.env.FRONTEND_URL}/login?error=invalid_state`,
        );
      }

      // Clear state cookies
      res.clearCookie('oauth_state', cookieClearOpts);
      res.clearCookie('oauth_state_sig', cookieClearOpts);

      // Exchange code for tokens
      const tokens = await this.authService.exchangeCodeForTokens(code);
      const profile = this.authService.decodeIdToken(tokens.id_token);

      console.log('Profile from Azure AD:', profile.preferred_username);

      const email = profile.preferred_username || profile.email;
      if (!email) {
        console.error('No email found in profile');
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_email`);
      }

      // Find or create user
      const user = await this.authService.findOrCreateUser({
        email,
        name: profile.name || email,
      });

      // Create JWT payload
      const jwtPayload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };

      // Issue tokens
      const accessToken = this.jwt.sign(jwtPayload, { expiresIn: '1h' });
      const refreshToken = this.jwt.sign({ id: user.id }, { expiresIn: '7d' });

      // Set cookies
      const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: 'none' as const,
        path: '/',
      };

      res.cookie('access_token', accessToken, {
        ...cookieOptions,
        maxAge: 60 * 60 * 1000,
      });

      res.cookie('refresh_token', refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      console.log('Login successful, redirecting to dashboard');
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
    } catch (err) {
      console.error('Error in Azure callback:', err);
      res.clearCookie('oauth_state', cookieClearOpts);
      res.clearCookie('oauth_state_sig', cookieClearOpts);
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=auth_failed`,
      );
    }
  }

  @Post('refresh')
  refresh(@Req() req: RequestWithCookies, @Res() res: Response) {
    const isProd = process.env.NODE_ENV === 'production';

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
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        maxAge: 60 * 60 * 1000, // 1 hour
      });

      return res.json({ accessToken });
    } catch {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
  }

  // Backend: auth.controller.ts
  @Post('logout')
  logout(@Res() res: Response) {
    const isProd = process.env.NODE_ENV === 'production';

    // Clear application cookies
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
    });

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
    });

    // Azure AD logout with prompt parameter
    const tenantId = process.env.AZURE_AD_TENANT_ID;
    const redirectUri = encodeURIComponent(process.env.FRONTEND_URL + '/login');

    // Add prompt=select_account to the redirect URI so after Azure logout,
    // users will see account picker on next login
    const logoutUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/logout?post_logout_redirect_uri=${redirectUri}`;

    return res.status(200).json({
      message: 'Logged out',
      logoutUrl,
    });
  }
}
