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
      this.envService.getCurrentAuthEnv(request);
    const authData = await this.authDataService.provideAuthData(
      request,
      response
    );
    return Promise.resolve({
      authData,
      oauthServerUrl,
      oauthTokenUrl,
      clientId,
    });
  }
}
