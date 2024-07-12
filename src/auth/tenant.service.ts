import { Injectable } from '@nestjs/common';
import { Request } from 'express';

export interface TenantService {
  provideTenant: (request: Request) => Promise<string>;
}

@Injectable()
export class EmptyTenantService implements TenantService {
  provideTenant(request: Request): Promise<string> {
    return Promise.resolve('');
  }
}
