import { EmptyAuthConfigService } from './auth/auth-config.service.js';
import {
  AuthCallback,
  AuthConfigService,
  AuthController,
  AuthTokenService,
  NoopAuthCallback,
} from './auth/index.js';
import {
  ConfigController,
  ContentConfigurationLuigiDataService,
  ContentConfigurationValidatorService,
  DefaultServiceProviderService,
  EntityContextProviders,
  EnvFeatureTogglesProvider,
  IntentResolveService,
  LuigiConfigNodesService,
  LuigiDataService,
  PortalContextProvider,
  PortalContextProviderImpl,
  RequestContextProvider,
  RequestContextProviderImpl,
  ServiceProviderService,
} from './config/index.js';
import { ConfigTransferNodeService } from './config/luigi/luigi-data/config-transfer-node.service.js';
import { NodeExtendedDataService } from './config/luigi/luigi-data/node-extended-data.service.js';
import { TextsTranslateService } from './config/luigi/luigi-data/texts-translate.service.js';
import {
  DiscoveryService,
  EmptyVariablesService,
  EnvController,
  EnvService,
  EnvVariablesService,
} from './env/index.js';
import {
  EmptyHealthChecker,
  HealthChecker,
  HealthController,
} from './health/index.js';
import {
  AUTH_CALLBACK_INJECTION_TOKEN,
  AUTH_CONFIG_INJECTION_TOKEN,
  ENTITY_CONTEXT_INJECTION_TOKEN,
  ENV_VARIABLES_PROVIDER_INJECTION_TOKEN,
  FEATURE_TOGGLES_INJECTION_TOKEN,
  HEALTH_CHECKER_INJECTION_TOKEN,
  LOGOUT_CALLBACK_INJECTION_TOKEN,
  LUIGI_DATA_SERVICE_INJECTION_TOKEN,
  PORTAL_CONTEXT_INJECTION_TOKEN,
  REQUEST_CONTEXT_INJECTION_TOKEN,
  SERVICE_PROVIDER_INJECTION_TOKEN,
} from './injection-tokens.js';
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
  ForwardReference,
  Logger,
  MiddlewareConsumer,
  Module,
  NestModule,
  Provider,
  Type,
} from '@nestjs/common';
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
   * Will be called to determine the health of the application. If there is a rejected promise, or false is returned, the
   * health is not successful
   */
  healthChecker?: Type<HealthChecker>;

  /**
   * Service providing environment variables required to be sent to the clients.
   */
  envVariablesProvider?: Type<EnvVariablesService>;

  /**
   * Makes it possible to extend the luigi context of every luigi node with contextValues
   * The values will be available in the context under the property 'portalContext'
   */
  portalContextProvider?: Type<PortalContextProvider>;

  /**
   * Makes it possible to extend the request parameters context with additional data required and used by service providers
   */
  requestContextProvider?: Type<RequestContextProvider>;

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

  /**
   * Auth config variables provider service.
   */
  authConfigProvider?: Type<AuthConfigService>;

  /**
   * Will be called to execute additional logic, when a user is logged out.
   * The portal will take care of clearing the authentication cookie and the redirection logic during the logout process.
   */
  logoutCallbackProvider?: Type<LogoutCallback>;
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
      ContentConfigurationLuigiDataService,
      ContentConfigurationValidatorService,
      EmptyAuthConfigService,
      PortalContextProviderImpl,
      {
        provide: AUTH_CALLBACK_INJECTION_TOKEN,
        useClass: options.authCallbackProvider || NoopAuthCallback,
      },
      {
        provide: AUTH_CONFIG_INJECTION_TOKEN,
        useClass: options.authConfigProvider || EmptyAuthConfigService,
      },
      {
        provide: HEALTH_CHECKER_INJECTION_TOKEN,
        useClass: options.healthChecker || EmptyHealthChecker,
      },
      {
        provide: ENV_VARIABLES_PROVIDER_INJECTION_TOKEN,
        useClass: options.envVariablesProvider || EmptyVariablesService,
      },
      {
        provide: LOGOUT_CALLBACK_INJECTION_TOKEN,
        useClass: options.logoutCallbackProvider || NoopLogoutService,
      },
      {
        provide: REQUEST_CONTEXT_INJECTION_TOKEN,
        useClass: options.requestContextProvider || RequestContextProviderImpl,
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
        useClass:
          options.serviceProviderService || DefaultServiceProviderService,
      },
      {
        provide: LUIGI_DATA_SERVICE_INJECTION_TOKEN,
        useClass:
          options.luigiDataService || ContentConfigurationLuigiDataService,
      },
    ];

    if (options.portalContextProvider) {
      providers.push({
        provide: PORTAL_CONTEXT_INJECTION_TOKEN,
        useClass: options.portalContextProvider,
      });
    }

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
          exclude: ['/rest', '/callback'],
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
