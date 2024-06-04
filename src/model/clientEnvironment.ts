export interface ServerAuthEnvironment {
  oauthServerUrl: string;
  clientId: string;
}

export interface EnvVariables {
  idpNames: string[];
  healthCheckInterval?: number;
  isLocal?: boolean;
  frontendPort?: string;
  developmentInstance?: boolean;
  validWebcomponentUrls?: string[];
}

export interface ClientEnvironment
  extends ServerAuthEnvironment,
    EnvVariables {}
