import { Request, Response } from 'express';
import { AuthDataService } from '../auth';

export interface EnvVariablesService {
  getEnv: (
    request: Request,
    response: Response
  ) => Promise<Record<string, any>>;
}

export class EnvVariablesServiceImpl implements EnvVariablesService {
  constructor(private authDataService: AuthDataService) {}

  async getEnv(
    request: Request,
    response: Response
  ): Promise<Record<string, any>> {
    const authData = await this.authDataService.provideAuthData(
      request,
      response
    );
    return Promise.resolve(authData);
  }
}
