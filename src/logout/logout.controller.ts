import { Controller, Get, Inject, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { CookiesService } from '../services';
import { LogoutCallback } from './logout-callback';
import { LOGOUT_CALLBACK_INJECTION_TOKEN } from '../injection-tokens';
import { EnvService } from '../env';

@Controller('/rest/logout')
export class LogoutController {
  constructor(
    @Inject(LOGOUT_CALLBACK_INJECTION_TOKEN)
    private logoutCallback: LogoutCallback,
    private envService: EnvService,
    private cookiesService: CookiesService
  ) {}

  @Get()
  async logout(@Req() request: Request, @Res() response: Response): Response {
    this.cookiesService.removeAuthCookie(response);
    await this.logoutCallback.handleLogout(request, response);

    let redirectURL = this.envService.getEnv().logoutRedirectUrl;
    if (request.query.error) {
      const error = request.query.error as string;
      redirectURL += `?error=${error}`;
    }
    return response.redirect(redirectURL);
  }
}
