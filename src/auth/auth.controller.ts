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
import { AuthCallback } from './authCallback';
import { AUTH_CALLBACK_INJECTION_TOKEN } from '../injectionTokens';
import { IasService, IasResponse } from './ias.service';

@Controller('/rest/auth')
export class AuthController {
  constructor(
    @Inject(AUTH_CALLBACK_INJECTION_TOKEN) private authCallback: AuthCallback,
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

    const iasResponse: IasResponse = await this.iasService.exchangeTokenForCode(
      request,
      response,
      code.toString()
    );

    await this.authCallback.callback(iasResponse.id_token);
    return this.filterIasResponseForFrontend(iasResponse);
  }

  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<IasResponse> {
    const authCookie = this.iasService.getAuthCookie(request);
    if (!authCookie) {
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
          authCookie
        );
      await this.authCallback.callback(iasResponse.id_token);
      this.logger.debug('refreshing auth successful');
      return this.filterIasResponseForFrontend(iasResponse);
    } catch (e: any) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      this.logger.error(`error while refreshing token, logging out: ${e}`);
      // logout to trigger a fresh login flow
      await this.iasService.removeAuthCookies(response);
      throw e;
    }
  }

  private filterIasResponseForFrontend(iasResponse: IasResponse): IasResponse {
    delete iasResponse.refresh_token;
    return iasResponse;
  }
}
