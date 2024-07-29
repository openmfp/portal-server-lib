import {
  Controller,
  Post,
  Req,
  Inject,
  Res,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CookiesService } from '../services';
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

  @Post('')
  async auth(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<AuthTokenData> {
    const code = request.query.code;
    if (!code) {
      throw new HttpException(
        "no 'code' was provided in the query",
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      const authTokenResponse: AuthTokenData =
        await this.authTokenService.exchangeTokenForCode(
          request,
          response,
          code.toString()
        );
      return await this.handleTokenRetrieval(
        request,
        response,
        authTokenResponse
      );
    } catch (e: any) {
      this.logger.error(`error while retrieving token, logging out: ${e}`);
      // logout to trigger a fresh login flow
      await this.authCallbackService.handleFailure(request, response);
      this.cookiesService.removeAuthCookie(response);
      throw e;
    }
  }

  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<AuthTokenData> {
    const authCookie = this.cookiesService.getAuthCookie(request);
    if (!authCookie) {
      throw new HttpException(
        'the user is not logged in',
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      const authTokenResponse: AuthTokenData =
        await this.authTokenService.exchangeTokenForRefreshToken(
          request,
          response,
          authCookie
        );
      return await this.handleTokenRetrieval(
        request,
        response,
        authTokenResponse
      );
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
