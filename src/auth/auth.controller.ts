import { EnvService } from '../env/index.js';
import {
  AUTH_CALLBACK_INJECTION_TOKEN,
  AUTH_CONFIG_INJECTION_TOKEN,
  LOGOUT_CALLBACK_INJECTION_TOKEN,
} from '../injection-tokens.js';
import { LogoutCallback } from '../logout/index.js';
import { CookiesService, RequestCodeParamGuard } from '../services/index.js';
import { AuthConfigProvider } from './auth-config-providers/index.js';
import { AuthCallback } from './auth.callback.js';
import { AuthTokenData, AuthTokenServiceImpl } from './token/index.js';
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
    @Inject(AUTH_CONFIG_INJECTION_TOKEN)
    private authConfigProvider: AuthConfigProvider,
    @Inject(LOGOUT_CALLBACK_INJECTION_TOKEN)
    private logoutCallback: LogoutCallback,
    private envService: EnvService,
    private cookiesService: CookiesService,
    private authTokenService: AuthTokenServiceImpl,
  ) {}

  @UseGuards(RequestCodeParamGuard)
  @Get('callback')
  async auth(@Req() request: Request, @Res() response: Response): Response {
    const { code, state } = request.query;
    let postLoginRedirectUrl = this.createAppStateUrl(state);

    try {
      if (!(await this.isDomainOrSubdomain(request, postLoginRedirectUrl))) {
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

  private async isDomainOrSubdomain(request: Request, appStateUrl: url.URL) {
    const { baseDomain } = await this.authConfigProvider.getAuthConfig(request);
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
      this.logger.error(`Error while refreshing token, logging out soon: ${e}`);
      // the redirection to logout is handled by Luigi once the token expires
      await this.handleAuthError(request, response);
      return;
    }
    return await this.handleTokenRetrieval(request, response, authTokenData);
  }

  private async handleTokenRetrieval(
    request: Request,
    response: Response,
    authTokenResponse: AuthTokenData,
  ) {
    this.cookiesService.setAuthCookie(request, response, authTokenResponse);
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
