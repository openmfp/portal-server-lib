import { Request, Response } from 'express';

export interface EnvVariablesService {
  getEnv: (
    request: Request,
    response: Response
  ) => Promise<Record<string, any>>;
}

export class EmptyEnvVariablesService implements EnvVariablesService {
  getEnv(request: Request, response: Response): Promise<Record<string, any>> {
    return Promise.resolve({});
  }
}
