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
import { CookiesService } from '../services/cookies.service';
import { AuthCallback } from './auth.callback';
import { AUTH_CALLBACK_INJECTION_TOKEN } from '../injection-tokens';
import { IasService, IasResponse } from './ias.service';

@Controller('/rest/auth')
export class AuthController {
  constructor(
    @Inject(AUTH_CALLBACK_INJECTION_TOKEN)
    private authCallbackService: AuthCallback,
    private cookiesService: CookiesService,
    private iasService: IasService,
    private logger: Logger
  ) {}

  @Post('')
  async auth(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<IasResponse> {
    const code = request.query.code;
    if (!code) {
      throw new HttpException(
        "no 'code' was provided in the query",
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      const iasResponse: IasResponse =
        await this.iasService.exchangeTokenForCode(
          request,
          response,
          code.toString()
        );
      this.logger.debug('retrieving token successful');
      return await this.handleTokenRetrieval(request, response, iasResponse);
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
  ): Promise<IasResponse> {
    const dxpAuthCookie = this.cookiesService.getAuthCookie(request);
    if (!dxpAuthCookie) {
      throw new HttpException(
        'the user is not logged in',
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      const iasResponse: IasResponse =
        await this.iasService.exchangeTokenForRefreshToken(
          request,
          response,
          dxpAuthCookie
        );
      this.logger.debug('retrieving refreshing auth successful');
      return await this.handleTokenRetrieval(request, response, iasResponse);
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
    iasResponse: IasResponse
  ) {
    await this.authCallbackService.handleSuccess(
      request,
      response,
      iasResponse
    );
    return this.filterIasResponseForFrontend(iasResponse);
  }

  private filterIasResponseForFrontend(iasResponse: IasResponse): IasResponse {
    delete iasResponse.refresh_token;
    delete iasResponse.refresh_expires_in;
    return iasResponse;
  }
}
