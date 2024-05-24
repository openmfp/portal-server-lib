import { DynamicModule, Logger, Module, Type } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EnvService } from './env/env.service';
import {
  AUTH_CALLBACK_INJECTION_TOKEN,
  HEALTH_CHECKER_INJECTION_TOKEN,
} from './injectionTokens';
import { Provider } from '@nestjs/common/interfaces/modules/provider.interface';
import { HealthController } from './health/health.controller';
import { EmptyHealthChecker, HealthChecker } from './health/healthChecker';
import { ForwardReference } from '@nestjs/common/interfaces/modules/forward-reference.interface';
import { AuthController } from './auth/auth.controller';
import { AuthDataService } from './auth/auth-data.service';
import { AuthCallback, NoopAuthCallback } from './auth/authCallback';
import { IasService } from './auth/ias.service';

export interface PortalModuleOptions {
  authCallbackProvider?: Type<AuthCallback>;

  /**
   * Providers that need to be known to this module, to create an instance of the other providers, that are added here.
   */
  additionalProviders?: Provider[];

  /**
   * Will be called to determine the heath of the application. If there is a rejected promise, or false is returned, the
   * health is not successful
   */
  healthChecker?: Type<HealthChecker>;
}

@Module({})
export class PortalModule {
  static create(options: PortalModuleOptions): DynamicModule {
    const controllers: any[] = [AuthController, HealthController];

    let providers: Provider[] = [
      EnvService,
      Logger,
      IasService,
      AuthDataService,
      {
        provide: HEALTH_CHECKER_INJECTION_TOKEN,
        useClass: options.healthChecker || EmptyHealthChecker,
      },
      {
        provide: AUTH_CALLBACK_INJECTION_TOKEN,
        useClass: options.authCallbackProvider || NoopAuthCallback,
      },
    ];

    if (options.additionalProviders) {
      providers = providers.concat(options.additionalProviders);
    }

    const moduleImports: Array<
      Type | DynamicModule | Promise<DynamicModule> | ForwardReference
    > = [HttpModule.register({})];

    return {
      module: PortalModule,
      imports: moduleImports,
      controllers,
      providers,
    };
  }
}
