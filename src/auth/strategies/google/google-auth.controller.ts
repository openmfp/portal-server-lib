import { AUTH_CALLBACK_INJECTION_TOKEN } from '../../../injection-tokens.js';
import { CookiesService } from '../../../services/index.js';
import { AuthCallback } from '../../auth.callback.js';
import { TokenGenerator } from '../../token/index.js';
import {
  Controller,
  Get,
  Inject,
  Logger,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';

@Controller('/rest/auth/google')
export class GoogleAuthController {
  private logger: Logger = new Logger(GoogleAuthController.name);

  constructor(
    @Inject(AUTH_CALLBACK_INJECTION_TOKEN)
    private readonly authCallbackService: AuthCallback,
    private readonly cookiesService: CookiesService,
    private readonly tokenGenerator: TokenGenerator,
  ) {}

  @Get('/')
  @UseGuards(AuthGuard('google'))
  async google(@Req() request: Request, @Res() response: Response): Response {}

  @Get('/redirect')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() request: Request, @Res() response: Response) {
    const payload = request.user;

    const tokens = await this.tokenGenerator.generateTokens(payload);
    const authTokenData = {
      access_token: tokens.access_token,
      expires_in: tokens.expires_in,
      refresh_token: tokens.refresh_token,
    };

    this.cookiesService.setAuthCookie(request, response, authTokenData);
    await this.authCallbackService.handleSuccess(
      request,
      response,
      authTokenData,
    );
    return response.redirect('/');
  }
}
