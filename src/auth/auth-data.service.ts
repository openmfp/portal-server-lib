import { Injectable, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { IasService } from './ias.service';
import { IasAuthData } from './model/auth';

@Injectable()
export class AuthDataService {
  constructor(
    private iasService: IasService,
    private logger: Logger
  ) {}

  public async provideAuthData(
    request: Request,
    response: Response
  ): Promise<IasAuthData> {
    const dxpAuthCookie = this.iasService.getAuthCookie(request);
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
