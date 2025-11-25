import { Injectable } from '@nestjs/common';
import type { Request } from 'express';

export interface ServerAuthVariables {
  idpName?: string;
  baseDomain?: string;
  oauthServerUrl?: string;
  oauthTokenUrl?: string;
  clientId?: string;
  clientSecret?: string;
  oidcIssuerUrl?: string;
  endSessionUrl?: string;
}

export interface AuthConfigProvider {
  getAuthConfig(request: Request): Promise<ServerAuthVariables>;
}

@Injectable()
export class EmptyAuthConfigService implements AuthConfigProvider {
  constructor() {}

  public async getAuthConfig(request: Request): Promise<ServerAuthVariables> {
    return {};
  }
}
