import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Role } from '@prisma/client';
import * as crypto from 'crypto';
// Please work
@Injectable()
export class AuthService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Generate a random state string and sign it with JWT_SECRET
   * so we can verify it on callback without needing sessions.
   */
  generateState(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Sign a state value using HMAC so we can verify it wasn't tampered with.
   */
  signState(state: string): string {
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    return crypto.createHmac('sha256', secret).update(state).digest('hex');
  }

  /**
   * Verify a state value against its signature.
   */
  verifyState(state: string, signature: string): boolean {
    const expected = this.signState(state);
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature),
    );
  }

  /**
   * Build the Azure AD authorization URL.
   */
  getAuthorizationUrl(state: string): string {
    const tenantId = process.env.AZURE_AD_TENANT_ID;
    const clientId = process.env.AZURE_AD_CLIENT_ID;
    const redirectUri = process.env.AZURE_AD_REDIRECT_URI;

    const params = new URLSearchParams({
      client_id: clientId!,
      response_type: 'code',
      redirect_uri: redirectUri!,
      response_mode: 'query',
      scope: 'openid profile email',
      state: state,
      prompt: 'select_account',
    });

    return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens.
   */
  async exchangeCodeForTokens(code: string): Promise<any> {
    const tenantId = process.env.AZURE_AD_TENANT_ID;
    const clientId = process.env.AZURE_AD_CLIENT_ID;
    const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;
    const redirectUri = process.env.AZURE_AD_REDIRECT_URI;

    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

    const body = new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      code: code,
      redirect_uri: redirectUri!,
      grant_type: 'authorization_code',
      scope: 'openid profile email',
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Token exchange failed:', error);
      throw new Error(`Token exchange failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Decode the ID token (JWT) to get user profile info.
   * We don't need to verify the signature since we got it directly from Azure AD
   * over HTTPS in the token exchange.
   */
  decodeIdToken(idToken: string): any {
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid ID token format');
    }
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf-8'),
    );
    return payload;
  }

  /**
   * Find or create user from Azure AD profile.
   */
  async findOrCreateUser(profile: { email: string; name: string }) {
    let user = await this.databaseService.user.findUnique({
      where: { email: profile.email },
    });

    if (!user) {
      user = await this.databaseService.user.create({
        data: {
          email: profile.email,
          name: profile.name,
          role: Role.Developer,
        },
      });
      console.log('New user created:', user.email);
    }

    return user;
  }
}
