import { DynamicModule, Logger, Module, Type } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EnvService } from './env/env.service';
import {
  FRAME_OPTIONS_INJECTION_TOKEN,
  HEALTH_CHECKER_INJECTION_TOKEN,
} from './injectionTokens';
import { Provider } from '@nestjs/common/interfaces/modules/provider.interface';
import { HealthController } from './health/health.controller';
import { EmptyHealthChecker, HealthChecker } from './health/healthChecker';
import { ForwardReference } from '@nestjs/common/interfaces/modules/forward-reference.interface';

export interface FrameModuleOptions {
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
export class FrameModule {
  static create(options: FrameModuleOptions): DynamicModule {
    const controllers: any[] = [HealthController];

    let providers: Provider[] = [
      {
        provide: FRAME_OPTIONS_INJECTION_TOKEN,
        useValue: options,
      },
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
      module: FrameModule,
      imports: moduleImports,
      controllers,
      providers,
    };
  }
}
