import { JwtPayload } from '../../token/index.js';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    const clientID = configService.get<string>('OIDC_CLIENT_ID_GOOGLE');
    const clientSecret = configService.get<string>('OIDC_CLIENT_SECRET_GOOGLE');
    const callbackURL = '/rest/auth/google/redirect';

    super({
      clientID: clientID ?? 'disabled',
      clientSecret: clientSecret ?? 'disabled',
      callbackURL,
      scope: ['email', 'profile'],
    });

    this.enabled = !!(clientID && clientSecret);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    if (!this.enabled) {
      return done(new Error('Google OAuth is disabled'), null);
    }

    const { id, name, emails, photos } = profile;

    const lifespanTs =
      Date.now() +
      this.configService.get<number>('JWT_REFRESH_LIFESPAN_IN_SECONDS') * 1000;
    const payload: JwtPayload = {
      user_id: id,
      email: emails[0].value,
      first_name: name.givenName,
      last_name: name.familyName,
      icon: photos[0]?.value,
      rt_exp: lifespanTs,
    };

    done(null, payload);
  }
}
