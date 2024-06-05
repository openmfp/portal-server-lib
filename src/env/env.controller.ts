import { Controller, Get, Inject, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { EnvVariablesProvider } from './envVariablesProvider';
import { ENV_VARIABLES_PROVIDER_INJECTION_TOKEN } from '../injectionTokens';

@Controller('/rest/envconfig')
export class EnvController {
  constructor(
    @Inject(ENV_VARIABLES_PROVIDER_INJECTION_TOKEN)
    private envVariablesProvider: EnvVariablesProvider
  ) {}

  @Get()
  async getEnv(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<Record<string, any>> {
    return this.envVariablesProvider.getEnv(request, response);
  }
}
