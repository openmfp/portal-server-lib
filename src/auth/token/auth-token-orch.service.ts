import { AUTH_CONFIG_INJECTION_TOKEN } from '../../injection-tokens.js';
import { AuthConfigProvider } from '../auth-config-providers/index.js';
import { AuthTokenData, AuthTokenService } from './auth-token.service.js';
import { ExtAuthTokenService } from './ext-auth-token.service.js';
import { LocalAuthTokenService } from './local-auth-token.service.js';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';

@Injectable()
export class AuthTokenServiceImpl implements AuthTokenService {
  constructor(
    private readonly configService: ConfigService,
    private readonly extAuthTokenService: ExtAuthTokenService,
    private readonly localAuthTokenService: LocalAuthTokenService,
    @Inject(AUTH_CONFIG_INJECTION_TOKEN)
    private authConfigProvider: AuthConfigProvider,
  ) {}

  async exchangeTokenForCode(
    request: Request,
    response: Response,
    code: string,
  ): Promise<AuthTokenData> {
    const { oauthTokenUrl } =
      await this.authConfigProvider.getAuthConfig(request);
    if (!oauthTokenUrl) {
      return this.localAuthTokenService.exchangeTokenForCode(
        request,
        response,
        code,
      );
    } else {
      return this.extAuthTokenService.exchangeTokenForCode(
        request,
        response,
        code,
      );
    }
  }

  async exchangeTokenForRefreshToken(
    request: Request,
    response: Response,
    refreshToken: string,
  ): Promise<AuthTokenData> {
    const { oauthTokenUrl } =
      await this.authConfigProvider.getAuthConfig(request);
    if (!oauthTokenUrl) {
      return this.localAuthTokenService.exchangeTokenForRefreshToken(
        request,
        response,
        refreshToken,
      );
    } else {
      return this.extAuthTokenService.exchangeTokenForRefreshToken(
        request,
        response,
        refreshToken,
      );
    }
  }
}
