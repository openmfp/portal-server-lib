import { ENV_VARIABLES_PROVIDER_INJECTION_TOKEN } from '../injection-tokens.js';
import {
  EnvConfigVariables,
  EnvVariablesService,
} from './env-variables.service.js';
import { Controller, Get, Inject, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';

@Controller('/rest/envconfig')
export class EnvController {
  constructor(
    @Inject(ENV_VARIABLES_PROVIDER_INJECTION_TOKEN)
    private envVariablesProvider: EnvVariablesService,
  ) {}

  @Get()
  async getEnv(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<EnvConfigVariables> {
    return this.envVariablesProvider.getEnv(request, response);
  }
}
