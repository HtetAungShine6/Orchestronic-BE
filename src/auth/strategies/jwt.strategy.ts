import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { BackendJwtPayload } from 'src/lib/types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private pemKey: string | null = null;

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'eSo3PoOYP7BhJFaqfnsKz52mo3cpV1vb3M38IGzaFt4=',
    });
  }

  validate(payload: BackendJwtPayload) {
    return {
      email: payload.email,
      name: payload.name,
    };
  }
}
