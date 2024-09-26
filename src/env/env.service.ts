import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { DiscoveryService } from './discovery.service';

export interface ServerAuthVariables {
  oauthServerUrl: string;
  oauthTokenUrl: string;
  clientId: string;
  clientSecret: string;
}

export interface EnvVariables {
  idpNames?: string[];
  logoutRedirectUrl?: string;
  healthCheckInterval?: number;
  isLocal?: boolean;
  localFrontendPort?: string;
  developmentInstance?: boolean;
  validWebcomponentUrls?: string[];
}

interface BaseDomainsToIdp {
  idpName: string;
  baseDomain: string;
}

@Injectable()
export class EnvService {
  constructor(private discoveryService: DiscoveryService) {}

  public getEnv(): EnvVariables {
    return {
      idpNames: this.getIdpNames(),
      healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL, 10),
      logoutRedirectUrl: process.env.LOGOUT_REDIRECT_URL || '/logout',
      isLocal: process.env.ENVIRONMENT === 'local',
      developmentInstance: process.env.DEVELOPMENT_INSTANCE === 'true',
      localFrontendPort: process.env.FRONTEND_PORT || '8000',
      validWebcomponentUrls: (process.env.VALID_WEBCOMPONENT_URLS || '').split(
        ','
      ),
    };
  }

  public getFeatureToggles(): Record<string, boolean> {
    const featureToggleString = process.env.FEATURE_TOGGLES || '';
    const features = featureToggleString.split(',').filter(Boolean);
    const result = {};

    for (const feature of features) {
      const nameAndValue = feature.split('=');
      const name = nameAndValue[0].trim();
      result[name] = nameAndValue[1].toLowerCase().trim() === 'true';
    }

    return result;
  }

  public async getCurrentAuthEnv(
    request: Request
  ): Promise<ServerAuthVariables> {
    const baseDomainsToIdps = this.getBaseDomainsToIdp();
    const defaultTenant = baseDomainsToIdps.find(
      (x) => x.baseDomain === request.hostname
    );
    if (defaultTenant) {
      return await this.getAuthEnv(defaultTenant.idpName);
    }

    for (const baseDomainToIdp of baseDomainsToIdps) {
      const r = this.getBaseDomainRegex(baseDomainToIdp.baseDomain);
      const regExpExecArray = r.exec(request.hostname);
      if (!regExpExecArray) {
        continue;
      }

      if (regExpExecArray.length > 1) {
        return await this.getAuthEnv(regExpExecArray[1]);
      }
    }

    throw new Error(
      `${
        request.hostname
      } is not listed in the portal's base urls: '${baseDomainsToIdps
        .map((x) => x.baseDomain)
        .join(',')}'`
    );
  }

  private async getAuthEnv(idpName: string): Promise<ServerAuthVariables> {
    const env = this.getEnv();

    if (!env.idpNames.includes(idpName)) {
      throw new Error(`the idp '${idpName}' is not configured!`);
    }

    const idpEnvName = this.getIdpEnvName(idpName);

    const oidc = await this.discoveryService.getOIDC(idpEnvName);
    const oauthServerUrl =
      oidc && oidc.authorization_endpoint
        ? oidc.authorization_endpoint
        : process.env[`AUTH_SERVER_URL_${idpEnvName}`];
    const oauthTokenUrl =
      oidc && oidc.token_endpoint
        ? oidc.token_endpoint
        : process.env[`TOKEN_URL_${idpEnvName}`];

    const clientId = process.env[`OIDC_CLIENT_ID_${idpEnvName}`];
    const clientSecretEnvVar = `OIDC_CLIENT_SECRET_${idpEnvName}`;
    const clientSecret = process.env[clientSecretEnvVar];

    if (!oauthServerUrl || !oauthTokenUrl || !clientId || !clientSecret) {
      const hasClientSecret = !!clientSecret;
      throw new Error(
        `the idp ${idpName} is not properly configured. oauthServerUrl: '${oauthServerUrl}' oauthTokenUrl: '${oauthTokenUrl}' clientId: '${clientId}', has client secret (${clientSecretEnvVar}): ${String(
          hasClientSecret
        )}`
      );
    }

    return {
      oauthServerUrl: oauthServerUrl,
      clientId: clientId,
      clientSecret: clientSecret,
      oauthTokenUrl: oauthTokenUrl,
    };
  }

  private getIdpNames(): Array<string> {
    const idpNames = process.env.IDP_NAMES || '';
    return idpNames.split(',');
  }

  private getIdpEnvName(idpName: string) {
    return idpName.toUpperCase().replace('-', '_');
  }

  private getBaseDomainRegex(baseDomain: string): RegExp {
    return new RegExp(`(.*)\\.${baseDomain}`);
  }

  private getBaseDomainsToIdp(): BaseDomainsToIdp[] {
    let baseDomains: BaseDomainsToIdp[] = [];

    for (const idpName of this.getIdpNames()) {
      const idpEnvName = this.getIdpEnvName(idpName);
      const idpDomains = process.env[`BASE_DOMAINS_${idpEnvName}`] || '';
      const idpNames = idpDomains.split(',');
      baseDomains = baseDomains.concat(
        idpNames.filter(Boolean).map((baseDomain) => {
          return {
            idpName,
            baseDomain,
          };
        })
      );
    }

    return baseDomains;
  }
}
