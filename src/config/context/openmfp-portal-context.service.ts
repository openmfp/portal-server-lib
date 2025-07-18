import { EnvService } from '../../env/index.js';
import { PortalContextProvider } from './portal-context-provider.js';
import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import process from 'node:process';

@Injectable()
export class OpenmfpPortalContextService implements PortalContextProvider {
  private readonly openmfpPortalContext = 'OPENMFP_PORTAL_CONTEXT_';

  getContextValues(request: Request): Promise<Record<string, any>> {
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

    this.processGraphQLGatewayApiUrl(request, portalContext);
    return Promise.resolve(portalContext);
  }

  constructor(private envService: EnvService) {}

  private processGraphQLGatewayApiUrl(
    request: Request,
    portalContext: Record<string, any>,
  ): void {
    const org = this.envService.getDomain(request);
    const subDomain = request.hostname === org.domain ? '' : `${org.idpName}.`;
    portalContext.crdGatewayApiUrl = portalContext.crdGatewayApiUrl
      ?.replace('${org-subdomain}', subDomain)
      .replace('${org-name}', `${org.idpName}`);
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
