import { Injectable } from '@nestjs/common';

export interface EnvVariables {
  healthCheckInterval?: number;
}

@Injectable()
export class EnvService {
  public getEnv(): EnvVariables {
    return {
      healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL, 10),
    };
  }
}
