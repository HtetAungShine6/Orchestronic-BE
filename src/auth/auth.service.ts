import { Injectable } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import { JwtHeader } from 'jsonwebtoken';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

interface AzureADKeys {
  keys: Array<{
    kty: string;
    use: string;
    kid: string;
    n: string;
    e: string;
    x5c: string[];
    cloud_instance_name: string;
    issuer: string;
  }>;
}

@Injectable()
export class AuthService {
  constructor() {}

  extractKidFromToken(token: string): string | null {
    try {
      const decoded = jwt.decode(token, { complete: true }) as {
        header: JwtHeader;
      };
      return decoded?.header?.kid || null;
    } catch (err) {
      console.error('Failed to decode token:', err);
      return null;
    }
  }

  private jwkToPem(jwk: AzureADKeys['keys'][number]): string {
    // Use the x5c certificate if available (most reliable for Azure AD)
    if (jwk.x5c && jwk.x5c.length > 0) {
      const cert = jwk.x5c[0];
      const formattedCert = cert.match(/.{1,64}/g)?.join('\n') || cert;
      return `-----BEGIN CERTIFICATE-----\n${formattedCert}\n-----END CERTIFICATE-----`;
    }

    // Fallback: construct RSA public key from n and e
    try {
      const keyObject = crypto.createPublicKey({
        key: {
          kty: 'RSA',
          n: jwk.n,
          e: jwk.e,
        },
        format: 'jwk',
      });

      return keyObject.export({ type: 'spki', format: 'pem' }) as string;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to convert JWK to PEM: ${errorMessage}`);
    }
  }

  async getAzurePemKey(kid: string | null): Promise<string> {
    if (!kid) {
      throw new Error('KID is null');
    }
    const jwksRes: AxiosResponse<AzureADKeys> = await axios.get(
      `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/discovery/v2.0/keys`,
    );
    const jwk: AzureADKeys['keys'][number] | undefined = jwksRes.data.keys.find(
      (key) => key.kid === kid,
    );

    if (!jwk) {
      throw new Error(`No JWK found for KID: ${kid}`);
    }

    try {
      const pem = this.jwkToPem(jwk);
      return pem;
    } catch (err) {
      console.error('Failed to convert JWK to PEM:', err);
      throw err;
    }
  }
}
