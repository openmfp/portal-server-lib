import { Injectable, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { CookiesService } from '../services';
import { AuthTokenData, AuthTokenService } from './auth-token.service';

@Injectable()
export class AuthDataService {
  constructor(
    private authTokenService: AuthTokenService,
    private cookiesService: CookiesService,
    private logger: Logger
  ) {}

  public async provideAuthData(
    request: Request,
    response: Response
  ): Promise<AuthTokenData> {
    const authCookie = this.cookiesService.getAuthCookie(request);
    if (!authCookie) {
      return undefined;
    }

    try {
      return await this.authTokenService.exchangeTokenForRefreshToken(
        request,
        response,
        authCookie
      );
    } catch (e) {
      this.logger.error(e);
      return undefined;
    }
  }
}
