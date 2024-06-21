import { Injectable, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { CookiesService } from '../services/cookies.service';
import { IasResponse, IasService } from './ias.service';

@Injectable()
export class AuthDataService {
  constructor(
    private iasService: IasService,
    private cookiesService: CookiesService,
    private logger: Logger
  ) {}

  public async provideAuthData(
    request: Request,
    response: Response
  ): Promise<IasResponse> {
    const dxpAuthCookie = this.cookiesService.getAuthCookie(request);
    if (!dxpAuthCookie) {
      return undefined;
    }

    try {
      return await this.iasService.exchangeTokenForRefreshToken(
        request,
        response,
        dxpAuthCookie
      );
    } catch (e) {
      this.logger.error(e);
      return undefined;
    }
  }
}
