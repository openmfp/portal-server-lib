import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { IasService } from '../auth/ias.service';

@Controller('/rest/logout')
export class LogoutController {
  constructor(private iasService: IasService) {}

  @Get()
  async logout(@Req() request: Request, @Res() response: Response) {
    await this.iasService.removeAuthCookies(response);

    let redirectURL = '/logout';
    if (request.query.error) {
      const error = request.query.error as string;
      redirectURL += `?error=${error}`;
    }
    return response.redirect(redirectURL);
  }
}
