import { Injectable, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { IasService } from './ias.service';
import { IasAuthData } from '../model/clientEnvironment';

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
    const authCookie = this.iasService.getAuthCookie(request);
    if (!authCookie) {
      return undefined;
    }

    try {
      return await this.iasService.exchangeTokenForRefreshToken(
        request,
        response,
        authCookie
      );
    } catch (e) {
      this.logger.error(e);
      return undefined;
    }
  }
}
