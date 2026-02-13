import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { DatabaseService } from '../database/database.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
    UserModule,
  ],
  providers: [JwtStrategy, DatabaseService, AuthService],
  controllers: [AuthController],
  exports: [JwtStrategy],
})
export class AuthModule {}
