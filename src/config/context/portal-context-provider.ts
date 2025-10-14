import type { Request, Response } from 'express';

export interface PortalContextProvider {
  getContextValues(
    request: Request,
    response: Response,
  ): Promise<Record<string, any>>;
}

export class EmptyPortalContextProvider implements PortalContextProvider {
  async getContextValues(): Promise<Record<string, any>> {
    return {};
  }
}
