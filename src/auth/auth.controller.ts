import {
  Controller,
  Post,
  Req,
  Inject,
  Res,
  Logger,
  UseGuards,
  Get,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { EnvService } from '../env';
import { RequestCodeParamGuard, CookiesService } from '../services';
import { AuthCallback } from './auth.callback';
import { AUTH_CALLBACK_INJECTION_TOKEN } from '../injection-tokens';
import { AuthTokenService, AuthTokenData } from './auth-token.service';

@Controller('/rest/auth')
export class AuthController {
  constructor(
    @Inject(AUTH_CALLBACK_INJECTION_TOKEN)
    private authCallbackService: AuthCallback,
    private cookiesService: CookiesService,
    private authTokenService: AuthTokenService,
    private envService: EnvService,
    private logger: Logger
  ) {}

  @UseGuards(RequestCodeParamGuard)
  @Post('')
  async auth(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<AuthTokenData> {
    try {
      const authTokenData: AuthTokenData =
        await this.authTokenService.exchangeTokenForCode(
          request,
          response,
          request.query.code.toString()
        );

      return await this.handleTokenRetrieval(request, response, authTokenData);
    } catch (e: any) {
      this.logger.error(`error while retrieving token, logging out: ${e}`);
      await this.handleAuthError(request, response);
      throw e;
    }
  }

  @Get('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<AuthTokenData> {
    try {
      const refreshToken = this.cookiesService.getAuthCookie(request);
      if (!refreshToken) {
        return undefined;
      }

      const authTokenData: AuthTokenData =
        await this.authTokenService.exchangeTokenForRefreshToken(
          request,
          response,
          refreshToken
        );
      return await this.handleTokenRetrieval(request, response, authTokenData);
    } catch (e: any) {
      this.logger.error(`error while refreshing token, logging out: ${e}`);
      await this.handleAuthError(request, response);
      throw e;
    }
  }

  private async handleTokenRetrieval(
    request: Request,
    response: Response,
    authTokenResponse: AuthTokenData
  ) {
    await this.authCallbackService.handleSuccess(
      request,
      response,
      authTokenResponse
    );
    return this.filterAuthTokenResponseForFrontend(authTokenResponse);
  }

  private async handleAuthError(
    request: Request,
    response: Response
  ): Promise<void> {
    await this.authCallbackService.handleFailure(request, response);
    this.cookiesService.removeAuthCookie(response);

    // logout to trigger a fresh login flow
    const { logoutRedirectUrl } = this.envService.getEnv();
    response.redirect(logoutRedirectUrl);
  }

  private filterAuthTokenResponseForFrontend(
    authTokenResponse: AuthTokenData
  ): AuthTokenData {
    console.log(authTokenResponse);
    delete authTokenResponse.refresh_token;
    delete authTokenResponse.refresh_expires_in;
    return authTokenResponse;
  }
}
