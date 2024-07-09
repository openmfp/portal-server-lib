import { Inject, Injectable, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { CookiesService } from '../services/cookies.service';
import { AuthTokenResponse, AuthTokenService } from './auth-token.service';

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
  ): Promise<AuthTokenResponse> {
    const dxpAuthCookie = this.cookiesService.getAuthCookie(request);
    if (!dxpAuthCookie) {
      return undefined;
    }

    try {
      return await this.authTokenService.exchangeTokenForRefreshToken(
        request,
        response,
        dxpAuthCookie
      );
    } catch (e) {
      this.logger.error(e);
      return undefined;
    }
  }
}
