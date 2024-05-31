import { Injectable } from '@nestjs/common';
import { ServerAuthEnvironment } from '../model/auth';
import { Request } from 'express';
import { EnvVariables } from '../model/clientEnvironment';

interface BaseDomainsToIdp {
  idpName: string;
  baseDomain: string;
}

@Injectable()
export class EnvService {
  public getEnv(): EnvVariables {
    const validWebcomponentUrls = process.env.VALID_WEBCOMPONENT_URLS || '';

    return {
      idpNames: this.getIdpNames(),
      healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL, 10),
      isLocal: process.env.ENVIRONMENT === 'local',
      frontendPort: process.env.FRONTEND_PORT || '4300',
      developmentInstance: process.env.DEVELOPMENT_INSTANCE === 'true',
      validWebcomponentUrls: validWebcomponentUrls.split(','),
    };
  }

  public getCurrentAuthEnv(request: Request): ServerAuthEnvironment {
    const baseDomainsToIdps = this.getBaseDomainsToIdp();
    const defaultTenant = baseDomainsToIdps.find(
      (x) => x.baseDomain === request.hostname
    );

    if (defaultTenant) {
      return this.getAuthEnv(defaultTenant.idpName);
    }

    for (const baseDomainToIdp of baseDomainsToIdps) {
      const r = this.getBaseDomainRegex(baseDomainToIdp.baseDomain);
      const regExpExecArray = r.exec(request.hostname);
      if (!regExpExecArray) {
        continue;
      }

      if (regExpExecArray.length > 1) {
        return this.getAuthEnv(regExpExecArray[1]);
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

  private getAuthEnv(idpName: string): ServerAuthEnvironment {
    const env = this.getEnv();

    if (!env.idpNames.includes(idpName)) {
      throw new Error(`the idp '${idpName}' is not configured!`);
    }

    const idpEnvName = this.getIdpEnvName(idpName);
    const oauthServerUrl = process.env[`IAS_TENANT_URL_${idpEnvName}`];
    const clientId = process.env[`OIDC_CLIENT_ID_${idpEnvName}`];
    const clientSecretEnvVar = `OIDC_CLIENT_SECRET_${idpEnvName}`;
    const clientSecret = process.env[clientSecretEnvVar];

    if (!oauthServerUrl || !clientId || !clientSecret) {
      const hasClientSecret = !!clientSecret;
      throw new Error(
        `the idp ${idpName} is not properly configured. oauthServerUrl: '${oauthServerUrl}' clientId: '${clientId}', has client secret (${clientSecretEnvVar}): ${String(
          hasClientSecret
        )}`
      );
    }

    return {
      ...env,
      oauthServerUrl: oauthServerUrl,
      clientId: clientId,
      clientSecret: clientSecret,
    };
  }

  private getIdpEnvName(idpName: string) {
    return idpName.toUpperCase().replace('-', '_');
  }

  private getBaseDomainRegex(baseDomain: string): RegExp {
    return new RegExp(`(.*)\\.${baseDomain}`);
  }

  getIdpNames(): Array<string> {
    const idpNames = process.env.IDP_NAMES || '';
    return idpNames.split(',');
  }
}
