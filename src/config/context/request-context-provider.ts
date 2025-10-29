import { Injectable } from '@nestjs/common';
import type { Request } from 'express';

export interface RequestContextProvider {
  getContextValues(
    request: Request,
    response: Response,
    entity?: string,
  ): Promise<Record<string, any>>;
}

@Injectable()
export class RequestContextProviderImpl implements RequestContextProvider {
  async getContextValues(request: Request): Promise<Record<string, any>> {
    return request.query;
  }
}