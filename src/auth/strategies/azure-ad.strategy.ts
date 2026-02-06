import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { OIDCStrategy } from 'passport-azure-ad';
import { profile } from 'console';
import { DatabaseService } from '../../database/database.service';
import { Role } from '@prisma/client';

@Injectable()
export class AzureStrategy extends PassportStrategy(OIDCStrategy, 'azure-ad') {
  constructor(private readonly databaseService: DatabaseService) {
    const config = {
      identityMetadata: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0/.well-known/openid-configuration`,
      clientID: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      responseType: 'code',
      responseMode: 'query',
      redirectUrl: process.env.AZURE_AD_REDIRECT_URI,
      allowHttpForRedirectUrl: false, // Should be false in production
      passReqToCallback: false,
      scope: ['profile', 'email', 'openid'],
      prompt: 'select_account',
      validateIssuer: true,
      loggingLevel: 'info',
    };

    console.log('🔧 Azure Strategy initialized with config:');
    console.log(
      '   - Tenant ID:',
      process.env.AZURE_AD_TENANT_ID?.substring(0, 8) + '...',
    );
    console.log(
      '   - Client ID:',
      process.env.AZURE_AD_CLIENT_ID?.substring(0, 8) + '...',
    );
    console.log('   - Redirect URI:', process.env.AZURE_AD_REDIRECT_URI);

    super(config);
  }

  async validate(profile: any) {
    console.log('🔍 Azure Strategy validate() called');
    console.log('📝 Profile received:', JSON.stringify(profile, null, 2));

    try {
      const email = profile._json.preferred_username;
      console.log('📧 Email extracted:', email);

      if (!email) {
        console.error('❌ No email found in profile');
        throw new Error('No email found in Azure AD profile');
      }

      let user = await this.databaseService.user.findUnique({
        where: { email },
      });

      if (!user) {
        console.log('👤 User not found, creating new user');
        user = await this.databaseService.user.create({
          data: {
            email,
            name: profile._json.name,
            role: Role.Developer,
          },
        });
        console.log('✅ User created:', user);
      } else {
        console.log('✅ User found:', user);
      }

      return user;
    } catch (error) {
      console.error('❌ Error in Azure Strategy validate:', error);
      throw error;
    }
  }
}
