import { Request, Response } from 'express';

export interface EnvVariablesProvider {
  getEnv: (
    request: Request,
    response: Response
  ) => Promise<Record<string, any>>;
}

export class EmptyEnvVariablesProvider implements EnvVariablesProvider {
  getEnv(request: Request, response: Response): Promise<Record<string, any>> {
    return Promise.resolve({});
  }
}
