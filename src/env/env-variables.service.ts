import { AuthConfigService } from '../auth/index.js';
import { AUTH_CONFIG_INJECTION_TOKEN } from '../injection-tokens.js';
import { EnvService, EnvVariables } from './env.service.js';
import { Inject, Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';

export interface EnvConfigVariables extends EnvVariables {
  idpName: string;
  baseDomain: string;
  oauthServerUrl: string;
  oauthTokenUrl: string;
  oidcIssuerUrl?: string;
  clusterServerUrl?: string;
  clientId: string;
}

export interface EnvVariablesService {
  getEnv: (request: Request, response: Response) => Promise<EnvConfigVariables>;
}

@Injectable()
export class EnvVariablesServiceImpl implements EnvVariablesService {
  constructor(
    private envService: EnvService,
    @Inject(AUTH_CONFIG_INJECTION_TOKEN)
    private authConfigService: AuthConfigService,
  ) {}

  async getEnv(
    request: Request,
    _response: Response,
  ): Promise<EnvConfigVariables> {
    const {
      oauthServerUrl,
      oauthTokenUrl,
      oidcIssuerUrl,
      clusterServerUrl,
      clientId,
      idpName,
      baseDomain,
    } = await this.authConfigService.getAuthConfig(request);
    const {
      validWebcomponentUrls,
      logoutRedirectUrl,
      isLocal,
      developmentInstance,
    } = this.envService.getEnv();
    return {
      idpName,
      baseDomain,
      oauthServerUrl,
      oauthTokenUrl,
      oidcIssuerUrl,
      clusterServerUrl,
      clientId,
      validWebcomponentUrls,
      logoutRedirectUrl,
      isLocal,
      developmentInstance,
    };
  }
}
