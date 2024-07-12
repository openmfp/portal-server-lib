import { Request, Response } from 'express';
import { ServiceProvider } from '../model/luigi.node';

export interface ProvidersResult {
  providers: ServiceProvider[];
}

export interface PortalContextProvider {
  getContextValues(
    request: Request,
    response: Response,
    providersPromise: Promise<ProvidersResult | Error>
  ): Promise<Record<string, any>>;
}
