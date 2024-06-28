import { DynamicModule, Logger, Module, Type } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EnvService } from './env/env.service';
import {
  ENTITY_CONTEXT_INJECTION_TOKEN,
  ENV_VARIABLES_PROVIDER_INJECTION_TOKEN,
  FEATURE_TOGGLES_INJECTION_TOKEN,
  FRAME_CONTEXT_INJECTION_TOKEN,
  HEALTH_CHECKER_INJECTION_TOKEN,
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
import { ConfigController } from './config/config.controller';
import { FrameContextProvider } from './config/context/frame-context-provider';
import { EntityContextProviders } from './config/context/entity-context-provider';
import { EmptyFrameContextProvider } from './config/context/empty-frame-context-provider';
import { LocalTenantService, TenantService } from './auth/tenant.service';
import { EnvFeatureTogglesProvider } from './config/context/feature-toggles-provider';
import { LuigiDataService } from './config/luigi/luigi-data/luigi-data.service';
import { LuigiConfigNodesService } from './config/luigi/luigi-config-nodes/luigi-config-nodes.service';
import { HeaderParserService } from './services/header-parser.service';
import {
  EmptyServiceProviderService,
  ServiceProviderService,
} from './config/context/service-provider';
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
   * Service providing tenant id.
   */
  tenantProvider?: Type<TenantService>;

  /**
   * Makes it possible to extend the luigi context of every luigi node with contextValues
   * The values will be available in the context under the property 'frameContext'
   */
  frameContextProvider?: Type<FrameContextProvider>;

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
   * The path to the built sources of the frontend ui. They will be served statically, so the html site is on the same host.
   * If it is not provided, no sources will be served.
   */
  frontendDistSources?: string;
}

@Module({})
export class PortalModule {
  static create(options: PortalModuleOptions): DynamicModule {
    const controllers: any[] = [
      HealthController,
      EnvController,
      ConfigController,
    ];

    let providers: Provider[] = [
      EnvService,
      Logger,
      LuigiDataService,
      LuigiConfigNodesService,
      HeaderParserService,
      {
        provide: HEALTH_CHECKER_INJECTION_TOKEN,
        useClass: options.healthChecker || EmptyHealthChecker,
      },
      {
        provide: ENV_VARIABLES_PROVIDER_INJECTION_TOKEN,
        useClass: options.envVariablesProvider || EmptyEnvVariablesService,
      },
      {
        provide: TENANT_PROVIDER_INJECTION_TOKEN,
        useClass: options.tenantProvider || LocalTenantService,
      },
      {
        provide: FRAME_CONTEXT_INJECTION_TOKEN,
        useClass: options.frameContextProvider || EmptyFrameContextProvider,
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
