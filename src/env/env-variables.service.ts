import { Request, Response } from 'express';
import { AuthDataService } from '../auth';
import { EnvService } from './env.service';

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
  ): Promise<Record<string, any>> {
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
