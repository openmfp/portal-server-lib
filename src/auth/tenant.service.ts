import { Injectable } from '@nestjs/common';
import { EnvService } from '../env/env.service';
import { Request } from 'express';

export interface TenantService {
  provideTenant: (request: Request) => Promise<string>;
}

@Injectable()
export class LocalTenantService implements TenantService {
  private readonly tenantId: string;

  constructor(envService: EnvService) {
    this.tenantId = envService.getEnv().tenantId;
  }

  provideTenant(): Promise<string> {
    return Promise.resolve(this.tenantId);
  }
}
