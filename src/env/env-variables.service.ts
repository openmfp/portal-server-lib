import { ServerAuthVariables } from '../auth/index.js';
import { EnvVariables } from './env.service.js';
import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';

export type EnvConfigVariables = ServerAuthVariables | EnvVariables;

export interface EnvVariablesService {
  getEnv: (
    request: Request,
    response: Response,
  ) => Promise<Record<string, object>>;
}

@Injectable()
export class EmptyVariablesService implements EnvVariablesService {
  async getEnv(
    request: Request,
    _response: Response,
  ): Promise<Record<string, object>> {
    return {};
  }
}
