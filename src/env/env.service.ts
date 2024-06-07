import { Injectable } from '@nestjs/common';

export interface EnvVariables {
  tenantId?: string;
  healthCheckInterval?: number;
}

@Injectable()
export class EnvService {
  public getEnv(): EnvVariables {
    return {
      tenantId: process.env.TENANT_ID,
      healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL, 10),
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
