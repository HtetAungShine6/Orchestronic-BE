import { Injectable } from '@nestjs/common';
import { CustomJWTPayload } from 'src/lib/types';

@Injectable()
export class AzureTokenService {
  async verifyAzureToken(token: string): Promise<CustomJWTPayload | null> {
    let decoded: CustomJWTPayload;
    try {
      const { decodeJwt } = await import('jose');
      decoded = decodeJwt(token);
    } catch {
      return null;
    }

    const { jwtVerify, createRemoteJWKSet } = await import('jose');
    const JWKS = createRemoteJWKSet(
      new URL(
        `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/discovery/keys`,
      ),
    );

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: decoded.iss,
      audience: decoded.aud,
    });

    return payload;
  }
}
