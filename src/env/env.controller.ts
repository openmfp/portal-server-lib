import { AuthConfigService } from '../auth/index.js';
import {
  AUTH_CONFIG_INJECTION_TOKEN,
  ENV_VARIABLES_PROVIDER_INJECTION_TOKEN,
} from '../injection-tokens.js';
import {
  EnvConfigVariables,
  EnvVariablesService,
} from './env-variables.service.js';
import { EnvService } from './env.service.js';
import { Controller, Get, Inject, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';

@Controller('/rest/envconfig')
export class EnvController {
  constructor(
    @Inject(ENV_VARIABLES_PROVIDER_INJECTION_TOKEN)
    private envVariablesProvider: EnvVariablesService,
    @Inject(AUTH_CONFIG_INJECTION_TOKEN)
    private authConfigService: AuthConfigService,
    private envService: EnvService,
  ) {}

  @Get()
  async getEnv(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<EnvConfigVariables> {
    const {
      oauthServerUrl,
      oauthTokenUrl,
      oidcIssuerUrl,
      clientId,
      idpName,
      baseDomain,
    } = await this.authConfigService.getAuthConfig(request);
    return {
      ...this.envService.getEnv(),
      ...(await this.envVariablesProvider.getEnv(request, response)),
      oauthServerUrl,
      oauthTokenUrl,
      oidcIssuerUrl,
      clientId,
      idpName,
      baseDomain,
    } as EnvConfigVariables;
  }
}
