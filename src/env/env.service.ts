import { Injectable } from '@nestjs/common';

export interface EnvVariables {
  healthCheckInterval?: number;
  logoutRedirectUrl?: string;
}

@Injectable()
export class EnvService {
  public getEnv(): EnvVariables {
    return {
      healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL, 10),
      logoutRedirectUrl: process.env.LOGOUT_REDIRECT_URL || '/logout',
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
}
