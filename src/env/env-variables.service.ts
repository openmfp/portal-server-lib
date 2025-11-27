import { EnvVariables } from './env.service.js';
import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';

export interface EnvConfigVariables extends EnvVariables {
  idpName?: string;
  baseDomain?: string;
  oauthServerUrl?: string;
  oauthTokenUrl?: string;
  oidcIssuerUrl?: string;
  clientId?: string;
}

export interface EnvVariablesService {
  getEnv: (request: Request, response: Response) => Promise<EnvConfigVariables>;
}

@Injectable()
export class EmptyVariablesService implements EnvVariablesService {
  async getEnv(
    request: Request,
    _response: Response,
  ): Promise<EnvConfigVariables> {
    return {} as EnvConfigVariables;
  }
}
