import { DynamicModule, Logger, Module, Type } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import {
  AuthCallback,
  AuthController,
  AuthDataService,
  AuthTokenService,
  NoopAuthCallback,
} from './auth';
import {
  ConfigController,
  IntentResolveService,
  NodesProcessorService,
  NodesProcessorServiceImpl,
  FrameContextProvider,
} from './config';
import { EnvService } from './env';
import {
  AUTH_CALLBACK_INJECTION_TOKEN,
  ENTITY_CONTEXT_INJECTION_TOKEN,
  ENV_VARIABLES_PROVIDER_INJECTION_TOKEN,
  FEATURE_TOGGLES_INJECTION_TOKEN,
  PORTAL_CONTEXT_INJECTION_TOKEN,
  HEALTH_CHECKER_INJECTION_TOKEN,
  LOGOUT_CALLBACK_INJECTION_TOKEN,
  LUIGI_DATA_SERVICE_INJECTION_TOKEN,
  SERVICE_PROVIDER_INJECTION_TOKEN,
  TENANT_PROVIDER_INJECTION_TOKEN,
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
import { PortalContextProvider } from './config/context/portal-context-provider';
import { EntityContextProviders } from './config/context/entity-context-provider';
import { EmptyPortalContextProvider } from './config/context/empty-portal-context-provider';
import { EmptyTenantService, TenantService } from './auth/tenant.service';
import { EnvFeatureTogglesProvider } from './config/context/feature-toggles-provider';
import { LuigiConfigNodesService } from './config/luigi/luigi-config-nodes/luigi-config-nodes.service';
import {
  EmptyServiceProviderService,
  ServiceProviderService,
} from './config/context/service-provider';
import { LocalTenantService, TenantService } from './auth/tenant.service';
import { HeaderParserService, CookiesService } from './services';
import { ServeStaticModule } from '@nestjs/serve-static';

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

  /**
   * Service providing tenant id.
   */
  tenantProvider?: Type<TenantService>;

  /**
   * Makes it possible to extend the luigi context of every luigi node with contextValues
   * The values will be available in the context under the property 'frameContext'
   */
  frameContextProvider?: Type<PortalContextProvider>;

  /**
   * Makes it possible to extend the luigi context with values relevant for the respective entity instance.
   * entityContextProviders is map from the entity id to the provider. The provider will be loaded via dependency injection.
   * You can provide a class or a string that can gets resolved to a class. This class must implement the interface EntityContextProvider.
   * The values will be available in the context under the property 'entityContext'
   */
  entityContextProviders?: EntityContextProviders;

  /**
   * A service provider service is responsible for fetching microservice providers.
   * The micro-frontends need to specify a url.
   */
  serviceProviderService?: Type<ServiceProviderService>;

  /**
   * A custom service to process configuration coming from service providers
   */
  luigiDataService?: Type<LuigiDataService>;

  /**
   * The path to the built sources of the frontend ui. They will be served statically, so the html site is on the same host.
   * If it is not provided, no sources will be served.
   */
  frontendDistSources?: string;

  /**
   * Auth callback handler service.
   */
  authCallbackProvider?: Type<AuthCallback>;
}

@Module({})
export class PortalModule {
  static create(options: PortalModuleOptions): DynamicModule {
    const controllers: any[] = [
      AuthController,
      HealthController,
      EnvController,
      LogoutController,
      ConfigController,
    ];

    let providers: Provider[] = [
      Logger,
      EnvService,
      HeaderParserService,
      CookiesService,
      LuigiConfigNodesService,
      IntentResolveService,
      AuthDataService,
      AuthTokenService,
      {
        provide: AUTH_CALLBACK_INJECTION_TOKEN,
        useClass: options.authCallbackProvider || NoopAuthCallback,
      },
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
      {
        provide: TENANT_PROVIDER_INJECTION_TOKEN,
        useClass: options.tenantProvider || EmptyTenantService,
      },
      {
        provide: PORTAL_CONTEXT_INJECTION_TOKEN,
        useClass: options.frameContextProvider || EmptyPortalContextProvider,
      },
      {
        provide: ENTITY_CONTEXT_INJECTION_TOKEN,
        useValue: options.entityContextProviders || {},
      },
      {
        provide: FEATURE_TOGGLES_INJECTION_TOKEN,
        useClass: EnvFeatureTogglesProvider,
      },
      {
        provide: SERVICE_PROVIDER_INJECTION_TOKEN,
        useClass: options.serviceProviderService || EmptyServiceProviderService,
      },
      {
        provide: LUIGI_DATA_SERVICE_INJECTION_TOKEN,
        useClass:
          options.luigiDataService || ContentConfigurationLuigiDataService,
      },
    ];

    if (options.additionalProviders) {
      providers = providers.concat(options.additionalProviders);
    }

    const moduleImports: Array<
      Type | DynamicModule | Promise<DynamicModule> | ForwardReference
    > = [HttpModule.register({})];

    if (options.frontendDistSources) {
      moduleImports.push(
        ServeStaticModule.forRoot({
          rootPath: options.frontendDistSources,
          exclude: ['/rest'],
        })
      );
    }

    return {
      module: PortalModule,
      imports: moduleImports,
      controllers,
      providers,
    };
  }
}
