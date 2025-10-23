import { AUTH_CALLBACK_INJECTION_TOKEN } from '../injection-tokens.js';
import { CookiesService, RequestCodeParamGuard } from '../services/index.js';
import { AuthTokenData, AuthTokenService } from './auth-token.service.js';
import { AuthCallback } from './auth.callback.js';
import {
  Controller,
  Get,
  Inject,
  Logger,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import url from 'url';

@Controller('/')
export class AuthController {
  private logger: Logger = new Logger(AuthController.name);

  constructor(
    @Inject(AUTH_CALLBACK_INJECTION_TOKEN)
    private authCallbackService: AuthCallback,
    private cookiesService: CookiesService,
    private authTokenService: AuthTokenService,
  ) {}

  @UseGuards(RequestCodeParamGuard)
  @Get('callback')
  async auth(@Req() request: Request, @Res() response: Response): Response {
    const { code, state } = request.query;
    let postLoginRedirectUrl = this.createAppStateUrl(state);

    try {
      if (!this.isDomainOrSubdomain(postLoginRedirectUrl)) {
        throw new Error('Bad redirection url: ' + postLoginRedirectUrl);
      }

      const authTokenData = await this.authTokenService.exchangeTokenForCode(
        request,
        response,
        code,
      );

      await this.handleTokenRetrieval(request, response, authTokenData);
    } catch (e: any) {
      this.logger.error(
        `Error while retrieving token from code, logging out: ${e}`,
      );
      await this.handleAuthError(request, response);
      postLoginRedirectUrl = new URL(`${postLoginRedirectUrl.origin}/logout`);
      postLoginRedirectUrl.searchParams.set('error', 'loginError');
    }

    return response.redirect(postLoginRedirectUrl.href);
  }

  private isDomainOrSubdomain(appStateUrl: url.URL) {
    const baseDomain = process.env['BASE_DOMAINS_DEFAULT'];
    if (!baseDomain) return false;

    const hostname = appStateUrl.hostname;
    return hostname === baseDomain || hostname.endsWith(`.${baseDomain}`);
  }

  private createAppStateUrl(state: string): url.URL {
    const decodedState = atob(decodeURIComponent(state)).split('_luigiNonce=');
    const appState = decodeURI(decodedState[0] || '');
    return new URL(appState);
  }

  @Post('rest/auth/refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthTokenData | void> {
    const refreshToken = this.cookiesService.getAuthCookie(request);
    if (!refreshToken) {
      this.logger.warn('No refresh token present');
      return;
    }

    let authTokenData: AuthTokenData = null;
    try {
      authTokenData = await this.authTokenService.exchangeTokenForRefreshToken(
        request,
        response,
        refreshToken,
      );
    } catch (e: any) {
      this.logger.error(`Error while refreshing token, logging out: ${e}`);
      return await this.handleAuthError(request, response);
    }
    return await this.handleTokenRetrieval(request, response, authTokenData);
  }

  private async handleTokenRetrieval(
    request: Request,
    response: Response,
    authTokenResponse: AuthTokenData,
  ) {
    await this.authCallbackService.handleSuccess(
      request,
      response,
      authTokenResponse,
    );
    return this.filterAuthTokenResponseForFrontend(authTokenResponse);
  }

  private async handleAuthError(
    request: Request,
    response: Response,
  ): Promise<void> {
    this.cookiesService.removeAuthCookie(request, response);

    try {
      await this.authCallbackService.handleFailure(request, response);
    } catch (e) {
      this.logger.error(
        'Error while executing auth callback handle failure: ',
        e,
      );
    }
  }

  private filterAuthTokenResponseForFrontend(
    authTokenResponse: AuthTokenData,
  ): AuthTokenData {
    delete authTokenResponse.refresh_token;
    delete authTokenResponse.refresh_expires_in;
    return authTokenResponse;
  }
}
