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
      logoutRedirectUrl: process.env.LOGOUT_REDIRECT_URL,
    };
  }
}
