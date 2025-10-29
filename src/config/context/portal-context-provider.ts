import { PORTAL_CONTEXT_INJECTION_TOKEN } from '../../injection-tokens.js';
import { Inject, Injectable, Optional } from '@nestjs/common';
import type { Request, Response } from 'express';

export interface PortalContextProvider {
  getContextValues(
    request: Request,
    response: Response,
    portalContext: Record<string, any>,
  ): Promise<Record<string, any>>;
}

@Injectable()
export class PortalContextProviderImpl implements PortalContextProvider {
  private readonly openmfpPortalContext = 'OPENMFP_PORTAL_CONTEXT_';

  constructor(
    @Optional()
    @Inject(PORTAL_CONTEXT_INJECTION_TOKEN)
    private customPortalContextProvider?: PortalContextProvider,
  ) {}

  async getContextValues(
    request: Request,
    response: Response,
  ): Promise<Record<string, any>> {
    const portalContext: Record<string, any> = {};

    const keys = Object.keys(process.env).filter((item) =>
      item.startsWith(this.openmfpPortalContext),
    );
    keys.forEach((key) => {
      const keyName = key.substring(this.openmfpPortalContext.length).trim();
      if (keyName.length > 0) {
        const camelCaseName = this.toCamelCase(keyName);
        portalContext[camelCaseName] = process.env[key];
      }
    });

    if (!this.customPortalContextProvider) {
      return portalContext;
    }

    const customContext =
      await this.customPortalContextProvider.getContextValues(
        request,
        response,
        portalContext,
      );

    return customContext;
  }

  private toCamelCase(text: string): string {
    let firstSegment = true;
    const items = text.split('_').map((item) => {
      if (firstSegment) {
        firstSegment = false;
        return item.toLowerCase();
      }
      return this.capitalizeFirstLetter(item.toLowerCase());
    });
    return items.join('');
  }

  private capitalizeFirstLetter(text: string): string {
    return String(text).charAt(0).toUpperCase() + String(text).slice(1);
  }
}
