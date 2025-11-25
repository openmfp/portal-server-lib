import { AuthTokenData } from './auth-token.service.js';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

export interface JwtPayload {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  icon: string;
  rt_exp: number;
}

@Injectable()
export class TokenGenerator {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateTokens(payload: JwtPayload): Promise<AuthTokenData> {
    const accessToken = await this.jwtService.signAsync(payload);

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: `${this.configService.get('JWT_REFRESH_EXPIRATION_IN_SECONDS')}s`,
    });

    // todo gkr save the refreshToken to the user's record in the database

    return {
      access_token: accessToken,
      id_token: accessToken,
      refresh_token: refreshToken,
      expires_in: this.configService.get('JWT_EXPIRATION_IN_SECONDS'),
    };
  }
}
