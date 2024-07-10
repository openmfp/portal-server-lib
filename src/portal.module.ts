import { DynamicModule, Logger, Module, Type } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EnvService } from './env/env.service';
import {
  ENV_VARIABLES_PROVIDER_INJECTION_TOKEN,
  HEALTH_CHECKER_INJECTION_TOKEN,
  LOGOUT_CALLBACK_INJECTION_TOKEN,
} from './injection-tokens';
import { Provider } from '@nestjs/common/interfaces/modules/provider.interface';
import { HealthController } from './health/health.controller';
import { EmptyHealthChecker, HealthChecker } from './health/health-checker';
import { ForwardReference } from '@nestjs/common/interfaces/modules/forward-reference.interface';
import { EnvController } from './env/env.controller';
import {
  EmptyEnvVariablesService,
  EnvVariablesService,
} from './env/env-variables.service';
import { LogoutController } from './logout/logout.controller';
import { NoopLogoutService } from './logout/noop-logout.service';
import { LogoutCallback } from './logout/logout-callback';

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

  /**
   * Service providing environment variables required to be sent to the clients.
   */
  envVariablesProvider?: Type<EnvVariablesService>;

  /**
   * Will be called to execute additional logic, when a user is logged out.
   * The portal will take care of clearing the authentication cookie and the redirection logic during the logout process.
   */
  logoutCallbackProvider?: Type<LogoutCallback>;
}

@Module({})
export class PortalModule {
  static create(options: PortalModuleOptions): DynamicModule {
    const controllers: any[] = [
      HealthController,
      EnvController,
      LogoutController,
    ];

    let providers: Provider[] = [
      EnvService,
      Logger,
      {
        provide: HEALTH_CHECKER_INJECTION_TOKEN,
        useClass: options.healthChecker || EmptyHealthChecker,
      },
      {
        provide: ENV_VARIABLES_PROVIDER_INJECTION_TOKEN,
        useClass: options.envVariablesProvider || EmptyEnvVariablesService,
      },
      {
        provide: LOGOUT_CALLBACK_INJECTION_TOKEN,
        useClass: options.logoutCallbackProvider || NoopLogoutService,
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
