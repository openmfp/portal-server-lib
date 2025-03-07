import { Controller, Get, Inject, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { EnvVariablesService } from './env-variables.service';
import { ENV_VARIABLES_PROVIDER_INJECTION_TOKEN } from '../injection-tokens';

@Controller('/rest/envconfig')
export class EnvController {
  constructor(
    @Inject(ENV_VARIABLES_PROVIDER_INJECTION_TOKEN)
    private envVariablesProvider: EnvVariablesService
  ) {}

  @Get()
  async getEnv(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<Record<string, any>> {
    return this.envVariablesProvider.getEnv(request, response);
  }
}
