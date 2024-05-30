import { ServerAuthEnvironment } from './auth';

export interface EnvironmentBase {
  developmentInstance?: boolean;
  qualtricsSiteInterceptUrl?: string;
  qualtricsId?: string;
  validWebcomponentUrls?: string[];
  minimalPluginVersion?: number;
}

export interface ClientEnvironment
  extends ServerAuthEnvironment,
    EnvironmentBase {}

export interface EnvVariables extends EnvironmentBase {
  idpNames: string[];
  healthCheckInterval?: number;
  isLocal?: boolean;
  frontendPort?: string;
}
