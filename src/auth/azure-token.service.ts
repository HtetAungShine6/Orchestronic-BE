import { Injectable } from '@nestjs/common';
import { jwtVerify, createRemoteJWKSet, decodeJwt } from 'jose';
import { CustomJWTPayload } from 'src/lib/types';

@Injectable()
export class AzureTokenService {
  async verifyAzureToken(token: string): Promise<CustomJWTPayload | null> {
    let decoded: CustomJWTPayload;
    try {
      decoded = decodeJwt(token);
    } catch {
      return null;
    }

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
