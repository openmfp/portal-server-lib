import { EnvService } from '../env/index.js';
import { LOGOUT_CALLBACK_INJECTION_TOKEN } from '../injection-tokens.js';
import { CookiesService } from '../services/index.js';
import { LogoutCallback } from './logout-callback.js';
import { Controller, Get, Inject, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';

@Controller('/rest/logout')
export class LogoutController {
  constructor(
    @Inject(LOGOUT_CALLBACK_INJECTION_TOKEN)
    private logoutCallback: LogoutCallback,
    private envService: EnvService,
    private cookiesService: CookiesService,
  ) {}

  @Get()
  async logout(@Req() request: Request, @Res() response: Response): Response {
    this.cookiesService.removeAuthCookie(request, response);
    const redirect = await this.logoutCallback.handleLogout(request, response);

    let redirectURL = redirect || this.envService.getEnv().logoutRedirectUrl;
    if (request.query.error) {
      const error = request.query.error as string;
      redirectURL += `?error=${error}`;
    }
    return response.redirect(redirectURL);
  }
}
