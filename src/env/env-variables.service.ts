import { EnvService, EnvVariables } from './env.service.js';
import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';

export interface EnvConfigVariables extends EnvVariables {
  idpName: string;
  baseDomain: string;
  organization: string;
  oauthServerUrl: string;
  oauthTokenUrl: string;
  clientId: string;
}

export interface EnvVariablesService {
  getEnv: (
    request: Request,
    response: Response,
  ) => Promise<Record<string, any>>;
}

@Injectable()
export class EnvVariablesServiceImpl implements EnvVariablesService {
  constructor(private envService: EnvService) {}

  async getEnv(
    request: Request,
    response: Response,
  ): Promise<EnvConfigVariables> {
    const {
      oauthServerUrl,
      oauthTokenUrl,
      clientId,
      idpName,
      baseDomain,
      organization,
    } = await this.envService.getCurrentAuthEnv(request);
    const {
      validWebcomponentUrls,
      logoutRedirectUrl,
      isLocal,
      developmentInstance,
    } = this.envService.getEnv();
    return {
      idpName,
      baseDomain,
      organization,
      oauthServerUrl,
      oauthTokenUrl,
      clientId,
      validWebcomponentUrls,
      logoutRedirectUrl,
      isLocal,
      developmentInstance,
    };
  }
}
