import { Controller, Get, Inject, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { LogoutCallback } from './logout-callback';
import { LOGOUT_CALLBACK_INJECTION_TOKEN } from '../injection-tokens';

@Controller('/rest/logout')
export class LogoutController {
  constructor(
    @Inject(LOGOUT_CALLBACK_INJECTION_TOKEN)
    private logoutCallback: LogoutCallback
  ) {}

  @Get()
  async logout(@Req() request: Request, @Res() response: Response): Response {
    await this.logoutCallback.handleLogout(request, response);
    response.clearCookie('auth_cookie');

    let redirectURL = '/logout';
    if (request.query.error) {
      const error = request.query.error as string;
      redirectURL += `?error=${error}`;
    }
    return response.redirect(redirectURL);
  }
}
