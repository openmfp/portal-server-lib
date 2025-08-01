import { ServiceProvider } from '../model/luigi.node.js';
import type { Request, Response } from 'express';

export interface PortalContextProvider {
  getContextValues(
    request: Request,
    response: Response,
    providersPromise: Promise<ServiceProvider[] | Error>,
  ): Promise<Record<string, any>>;
}

export class EmptyPortalContextProvider implements PortalContextProvider {
  async getContextValues(): Promise<Record<string, any>> {
    return {};
  }
}
