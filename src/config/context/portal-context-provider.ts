import { Request, Response } from 'express';
import { ServiceProvider } from '../model/luigi.node';

export interface PortalContextProvider {
  getContextValues(
    request: Request,
    response: Response,
    providersPromise: Promise<ServiceProvider[] | Error>
  ): Promise<Record<string, any>>;
}
