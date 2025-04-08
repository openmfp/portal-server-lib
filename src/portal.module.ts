import {
  AuthCallback,
  AuthController,
  AuthTokenService,
  NoopAuthCallback,
} from './auth/index.js';
import {
  ConfigController,
  ConfigTransferNodeService,
  ContentConfigurationLuigiDataService,
  ContentConfigurationValidatorService,
  EmptyServiceProviderService,
  EntityContextProviders,
  EnvFeatureTogglesProvider,
  IntentResolveService,
  LuigiConfigNodesService,
  LuigiDataService,
  NodeExtendedDataService,
  OpenmfpPortalContextService,
  PortalContextProvider,
  ServiceProviderService,
  TextsTranslateService,
} from './config/index.js';
import {
  DiscoveryService,
  EnvController,
  EnvService,
  EnvVariablesService,
  EnvVariablesServiceImpl,
} from './env/index.js';
import {
  EmptyHealthChecker,
  HealthChecker,
  HealthController,
} from './health/index.js';
import {
  AUTH_CALLBACK_INJECTION_TOKEN,
  ENTITY_CONTEXT_INJECTION_TOKEN,
  ENV_VARIABLES_PROVIDER_INJECTION_TOKEN,
  FEATURE_TOGGLES_INJECTION_TOKEN,
  HEALTH_CHECKER_INJECTION_TOKEN,
  LOGOUT_CALLBACK_INJECTION_TOKEN,
  LUIGI_DATA_SERVICE_INJECTION_TOKEN,
  PORTAL_CONTEXT_INJECTION_TOKEN,
  SERVICE_PROVIDER_INJECTION_TOKEN,
} from './injection-tokens.js';
import { KubeController } from './kube/kube.controller.js';
import { LocalNodesController } from './local-nodes/index.js';
import {
  LogoutCallback,
  LogoutController,
  NoopLogoutService,
} from './logout/index.js';
import { CookiesService, HeaderParserService } from './services/index.js';
import { HttpModule } from '@nestjs/axios';
import {
  DynamicModule,
  Logger,
  MiddlewareConsumer,
  Module,
  NestModule,
  Type,
} from '@nestjs/common';
import { ForwardReference } from '@nestjs/common/interfaces/modules/forward-reference.interface.js';
import { Provider } from '@nestjs/common/interfaces/modules/provider.interface.js';
import { ServeStaticModule } from '@nestjs/serve-static';
import cookieParser from 'cookie-parser';

export interface PortalModuleOptions {
  /**
   * A set of additional controllers to be registered in the module.
   */
  additionalControllers?: any[];

  /**
   * A set of additional providers to be registered in the module.
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
   * Makes it possible to extend the luigi context of every luigi node with contextValues
   * The values will be available in the context under the property 'frameContext'
   */
  portalContextProvider?: Type<PortalContextProvider>;

  /**
   * Makes it possible to extend the luigi context with values relevant for the respective entity instance.
   * entityContextProviders is map from the entity id to the provider. The provider will be loaded via dependency injection.
   * You can provide a class or a string that can gets resolved to a class. This class must implement the interface EntityContextProvider.
   * The values will be available in the context under the property 'entityContext'
   */
  entityContextProviders?: EntityContextProviders;

  /**
   * A service provider service is responsible for fetching micro-service providers.
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
export class PortalModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(cookieParser()).forRoutes('*');
  }

  static create(options: PortalModuleOptions): DynamicModule {
    let controllers: any[] = [
      AuthController,
      HealthController,
      LocalNodesController,
      EnvController,
      LogoutController,
      ConfigController,
      KubeController,
    ];

    let providers: Provider[] = [
      Logger,
      EnvService,
      DiscoveryService,
      HeaderParserService,
      CookiesService,
      LuigiConfigNodesService,
      IntentResolveService,
      TextsTranslateService,
      ConfigTransferNodeService,
      NodeExtendedDataService,
      AuthTokenService,
      OpenmfpPortalContextService,
      ContentConfigurationLuigiDataService,
      ContentConfigurationValidatorService,
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
        useClass: options.envVariablesProvider || EnvVariablesServiceImpl,
      },
      {
        provide: LOGOUT_CALLBACK_INJECTION_TOKEN,
        useClass: options.logoutCallbackProvider || NoopLogoutService,
      },
      {
        provide: PORTAL_CONTEXT_INJECTION_TOKEN,
        useClass: options.portalContextProvider || OpenmfpPortalContextService,
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

    if (options.additionalControllers) {
      controllers = controllers.concat(options.additionalControllers);
    }

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
        }),
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
