import { DynamicModule, Logger, Module, Type } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EnvService } from './env/env.service';
import { HEALTH_CHECKER_INJECTION_TOKEN } from './injectionTokens';
import { Provider } from '@nestjs/common/interfaces/modules/provider.interface';
import { HealthController } from './health/health.controller';
import { EmptyHealthChecker, HealthChecker } from './health/healthChecker';
import { ForwardReference } from '@nestjs/common/interfaces/modules/forward-reference.interface';

export interface PortalModuleOptions {
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
    const controllers: any[] = [HealthController];

    let providers: Provider[] = [
      EnvService,
      Logger,
      {
        provide: HEALTH_CHECKER_INJECTION_TOKEN,
        useClass: options.healthChecker || EmptyHealthChecker,
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
