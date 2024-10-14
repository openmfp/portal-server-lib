import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthDataService, AuthTokenData } from '../auth';
import { EnvService } from './env.service';

export interface EnvConfigVariables {
  authData: AuthTokenData;
  oauthServerUrl: string;
  oauthTokenUrl: string;
  clientId: string;
}

export interface EnvVariablesService {
  getEnv: (
    request: Request,
    response: Response
  ) => Promise<Record<string, any>>;
}

@Injectable()
export class EnvVariablesServiceImpl implements EnvVariablesService {
  constructor(
    private authDataService: AuthDataService,
    private envService: EnvService
  ) {}

  async getEnv(
    request: Request,
    response: Response
  ): Promise<EnvConfigVariables> {
    const { oauthServerUrl, oauthTokenUrl, clientId } =
      await this.envService.getCurrentAuthEnv(request);
    const {
      validWebcomponentUrls,
      logoutRedirectUrl,
      isLocal,
      developmentInstance,
    } = this.envService.getEnv();
    const authData = await this.authDataService.provideAuthData(
      request,
      response
    );
    return Promise.resolve({
      authData,
      oauthServerUrl,
      oauthTokenUrl,
      clientId,
      validWebcomponentUrls,
      logoutRedirectUrl,
      isLocal,
      developmentInstance,
    });
  }
}
