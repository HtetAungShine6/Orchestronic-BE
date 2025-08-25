import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(private jwt: JwtService) {}

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
    const accessToken = this.jwt.sign({ ...user }, { expiresIn: '1h' });

    // Issue refresh token (store in DB or cache with expiration)
    const refreshToken = this.jwt.sign({ sub: user.id }, { expiresIn: '7d' });

    // Set refresh token as HTTP-only cookie
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });

    return res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?accessToken=${accessToken}`,
    );
  }

  @Post('refresh')
  refresh(@Req() req: any, @Res() res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token' });
    }

    try {
      const payload = this.jwt.verify(refreshToken);

      // Issue new short-lived access token
      const accessToken = this.jwt.sign(
        { sub: payload.sub },
        { expiresIn: '1h' },
      );

      return res.json({ accessToken });
    } catch {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
  }
}
