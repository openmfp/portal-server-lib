import {
  Controller,
  Post,
  Req,
  Inject,
  Res,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthGuard, AuthCodeGuard, CookiesService } from '../services';
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
    private logger: Logger
  ) {}

  @UseGuards(AuthCodeGuard)
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
      // logout to trigger a fresh login flow
      await this.authCallbackService.handleFailure(request, response);
      this.cookiesService.removeAuthCookie(response);
      throw e;
    }
  }

  @UseGuards(AuthGuard)
  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<AuthTokenData> {
    try {
      const refreshToken = this.cookiesService.getAuthCookie(request);
      const authTokenData: AuthTokenData =
        await this.authTokenService.exchangeTokenForRefreshToken(
          request,
          response,
          refreshToken
        );
      return await this.handleTokenRetrieval(request, response, authTokenData);
    } catch (e: any) {
      this.logger.error(`error while refreshing token, logging out: ${e}`);
      // logout to trigger a fresh login flow
      await this.authCallbackService.handleFailure(request, response);
      this.cookiesService.removeAuthCookie(response);
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

  private filterAuthTokenResponseForFrontend(
    authTokenResponse: AuthTokenData
  ): AuthTokenData {
    delete authTokenResponse.refresh_token;
    delete authTokenResponse.refresh_expires_in;
    return authTokenResponse;
  }
}
