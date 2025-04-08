import { ServiceProvider } from '../model/luigi.node.js';
import { Request, Response } from 'express';

export interface PortalContextProvider {
  getContextValues(
    request: Request,
    response: Response,
    providersPromise: Promise<ServiceProvider[] | Error>,
  ): Promise<Record<string, any>>;
}
