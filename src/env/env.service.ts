import { Injectable } from '@nestjs/common';

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

@Injectable()
export class EnvService {
  constructor() {}

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

  public getIdpNames(): Array<string> {
    const idpNames = process.env.IDP_NAMES || '';
    return idpNames.split(',').filter(Boolean);
  }
}
