import { AuthTokenData, AuthTokenService } from './auth-token.service.js';
import { JwtPayload, TokenGenerator } from './token-generator.js';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class LocalAuthTokenService implements AuthTokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private tokenGenerator: TokenGenerator,
  ) {}

  exchangeTokenForCode(
    request: Request,
    response: Response,
    code: string,
  ): Promise<AuthTokenData> {
    throw new Error('Method not implemented.');
  }

  exchangeTokenForRefreshToken(
    request: Request,
    response: Response,
    refreshToken: string,
  ): Promise<AuthTokenData> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      }) as any;
      const { user_id, email, first_name, last_name, icon, rt_exp } =
        payload as JwtPayload;

      if (Date.now() > rt_exp) {
        throw new UnauthorizedException(
          'Refresh period expired — login required.',
        );
      }

      return this.tokenGenerator.generateTokens({
        user_id,
        email,
        first_name,
        last_name,
        icon,
        rt_exp,
      });
    } catch (err) {
      throw new Error(`Invalid or expired refresh token: ${err}`);
    }
  }
}
