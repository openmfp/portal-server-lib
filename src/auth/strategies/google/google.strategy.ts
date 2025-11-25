import { JwtPayload } from '../../token/index.js';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get('OIDC_CLIENT_ID_GOOGLE'),
      clientSecret: configService.get('OIDC_CLIENT_SECRET_GOOGLE'),
      callbackURL: configService.get('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;

    const oneHourFromNow =
      Date.now() +
      this.configService.get<number>('JWT_REFRESH_LIFESPAN_IN_SECONDS') * 1000;
    const payload: JwtPayload = {
      user_id: id,
      email: emails[0].value,
      first_name: name.givenName,
      last_name: name.familyName,
      icon: photos[0]?.value,
      rt_exp: oneHourFromNow,
    };

    done(null, payload);
  }
}
