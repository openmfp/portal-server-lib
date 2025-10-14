import { DiscoveryService, EnvService } from '../env/index.js';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import _ from 'lodash';

interface BaseDomainsToIdp {
  idpName: string;
  baseDomain: string;
}

export interface ServerAuthVariables {
  idpName: string;
  baseDomain: string;
  oauthServerUrl: string;
  oauthTokenUrl: string;
  clientId: string;
  clientSecret: string;
  oidcIssuerUrl: string;
  endSessionUrl?: string;
}

export interface AuthConfigService {
  getAuthConfig(request: Request): Promise<ServerAuthVariables>;
}

@Injectable()
export class EnvAuthConfigService implements AuthConfigService {
  constructor(
    private envService: EnvService,
    private discoveryService: DiscoveryService,
  ) {}

  public async getAuthConfig(request: Request): Promise<ServerAuthVariables> {
    const idpNames = this.envService.getIdpNames();
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
      const baseDomainRegex = this.getBaseDomainRegex(
        baseDomainToIdp.baseDomain,
      );
      const regExpExecArray = baseDomainRegex.exec(request.hostname);
      if (!regExpExecArray) {
        continue;
      }

      const env = this.envService.getEnv();
      const subDomain = regExpExecArray[1];
      const subDomainIdpName = env.idpNames.includes(subDomain)
        ? subDomain
        : baseDomainToIdp.idpName;

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
    const env = this.envService.getEnv();

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

    const oidcUrl = process.env[`DISCOVERY_ENDPOINT_${idpEnvName}`];
    const oidc = await this.discoveryService.getOIDC(oidcUrl);
    const oauthServerUrl =
      oidc?.authorization_endpoint ??
      process.env[`AUTH_SERVER_URL_${idpEnvName}`];
    const oauthTokenUrl =
      oidc?.token_endpoint ?? process.env[`TOKEN_URL_${idpEnvName}`];

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
      oauthServerUrl,
      clientId,
      clientSecret,
      oauthTokenUrl,
      oidcIssuerUrl: oidc?.issuer ?? '',
    };
  }

  private getBaseDomainsToIdp(): BaseDomainsToIdp[] {
    let baseDomains: BaseDomainsToIdp[] = [];

    for (const idpName of this.envService.getIdpNames()) {
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

  private formatIdpNameForEnvVar(idpName: string) {
    return idpName.toUpperCase().replace('-', '_');
  }

  private getBaseDomainRegex(baseDomain: string): RegExp {
    const domain = _.escapeRegExp(baseDomain);
    return new RegExp(`(.*)\\.${domain}`);
  }
}
