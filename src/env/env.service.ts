import { DiscoveryService } from './discovery.service.js';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import _ from 'lodash';

export interface ServerAuthVariables {
  idpName: string;
  baseDomain: string;
  organization: string;
  oauthServerUrl: string;
  oauthTokenUrl: string;
  clientId: string;
  clientSecret: string;
}

export interface EnvVariables extends Record<string, any> {
  idpNames?: string[];
  oauthServerUrl?: string;
  oauthTokenUrl?: string;
  clientId?: string;
  logoutRedirectUrl?: string;
  healthCheckInterval?: number;
  isLocal?: boolean;
  frontendPort?: string;
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
      frontendPort: process.env.FRONTEND_PORT || '',
      validWebcomponentUrls: (process.env.VALID_WEBCOMPONENT_URLS || '').split(
        ',',
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

  public getDomain(request: Request): { idpName?: string; domain?: string } {
    const baseDomainsToIdps = this.getBaseDomainsToIdp();
    const defaultTenant = baseDomainsToIdps.find(
      (x) => x.baseDomain === request.hostname,
    );
    if (defaultTenant) {
      return {
        idpName: defaultTenant.idpName,
        domain: defaultTenant.baseDomain,
      };
    }

    for (const baseDomainToIdp of baseDomainsToIdps) {
      const r = this.getBaseDomainRegex(baseDomainToIdp.baseDomain);
      const regExpExecArray = r.exec(request.hostname);
      if (!regExpExecArray) {
        continue;
      }

      let subDomainIdpName = regExpExecArray[1];
      return {
        idpName: subDomainIdpName,
        domain: baseDomainToIdp.baseDomain,
      };
    }
    return {};
  }

  public async getCurrentAuthEnv(
    request: Request,
  ): Promise<ServerAuthVariables> {
    const idpNames = this.getIdpNames();
    if (!idpNames.length) {
      throw new HttpException(
        {
          message: 'Identity provider not found nor configured',
          error: 'The identity provider is not present!',
          statusCode: HttpStatus.NOT_FOUND,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    const baseDomainsToIdps = this.getBaseDomainsToIdp();
    const defaultTenant = baseDomainsToIdps.find(
      (x) => x.baseDomain === request.hostname,
    );
    if (defaultTenant) {
      return await this.getAuthEnv(
        defaultTenant.idpName,
        defaultTenant.baseDomain,
      );
    }

    for (const baseDomainToIdp of baseDomainsToIdps) {
      const r = this.getBaseDomainRegex(baseDomainToIdp.baseDomain);
      const regExpExecArray = r.exec(request.hostname);
      if (!regExpExecArray) {
        continue;
      }

      let subDomain = regExpExecArray[1];
      let subDomainIdpName = regExpExecArray[1];
      const env = this.getEnv();
      if (!env.idpNames.includes(subDomainIdpName)) {
        subDomainIdpName = baseDomainToIdp.idpName;
      }

      if (regExpExecArray.length > 1) {
        return await this.getAuthEnv(
          subDomainIdpName,
          baseDomainToIdp.baseDomain,
          subDomain,
        );
      }
    }

    throw new HttpException(
      {
        message: 'Domain not supported',
        error: `${
          request.hostname
        } is not listed in the portal's base urls: '${baseDomainsToIdps
          .map((x) => x.baseDomain)
          .join(',')}'`,
        statusCode: HttpStatus.NOT_FOUND,
      },
      HttpStatus.NOT_FOUND,
    );
  }

  private async getAuthEnv(
    idpName: string,
    baseDomain: string,
    subDomainIdpName?: string,
  ): Promise<ServerAuthVariables> {
    const env = this.getEnv();

    if (!env.idpNames.includes(idpName)) {
      throw new HttpException(
        {
          message: 'Identity provider not configured',
          error: `The idp '${idpName}' is not configured!`,
          statusCode: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const idpEnvName = this.formatIdpNameForEnvVar(idpName);

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
      throw new HttpException(
        {
          message: 'Identity provider configuration incomplete',
          error: `the idp ${idpName} is not properly configured. oauthServerUrl: '${oauthServerUrl}' oauthTokenUrl: '${oauthTokenUrl}' clientId: '${clientId}', has client secret (${clientSecretEnvVar}): ${String(
            hasClientSecret,
          )}`,
          statusCode: HttpStatus.NOT_FOUND,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    // if we have configured the subdomain idp name in the environment, we use it as a baseDomain
    if (idpName === subDomainIdpName) {
      baseDomain = `${subDomainIdpName}.${baseDomain}`;
    }

    return {
      idpName,
      baseDomain,
      organization: subDomainIdpName || idpName,
      oauthServerUrl: oauthServerUrl,
      clientId: clientId,
      clientSecret: clientSecret,
      oauthTokenUrl: oauthTokenUrl,
    };
  }

  private getIdpNames(): Array<string> {
    const idpNames = process.env.IDP_NAMES || '';
    return idpNames.split(',').filter(Boolean);
  }

  private formatIdpNameForEnvVar(idpName: string) {
    return idpName.toUpperCase().replace('-', '_');
  }

  private getBaseDomainRegex(baseDomain: string): RegExp {
    const domain = _.escapeRegExp(baseDomain);
    return new RegExp(`(.*)\\.${domain}`);
  }

  private getBaseDomainsToIdp(): BaseDomainsToIdp[] {
    let baseDomains: BaseDomainsToIdp[] = [];

    for (const idpName of this.getIdpNames()) {
      const idpEnvName = this.formatIdpNameForEnvVar(idpName);
      const idpDomains: BaseDomainsToIdp[] = (
        process.env[`BASE_DOMAINS_${idpEnvName}`] || ''
      )
        .split(',')
        .filter(Boolean)
        .map((baseDomain) => ({
          idpName,
          baseDomain,
        }));
      baseDomains.push(...idpDomains);
    }

    return baseDomains;
  }
}
