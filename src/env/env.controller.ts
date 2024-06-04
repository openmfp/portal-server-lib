import { Controller, Get, Req, Res } from '@nestjs/common';
import { EnvService } from './env.service';
import { Request, Response } from 'express';

@Controller('/rest/envconfig')
export class EnvController {
  constructor(private envService: EnvService) {}

  @Get()
  getEnv(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Record<string, any> {
    return this.envService.getCurrentAuthEnv(request.hostname);
  }
}
