import {
  Controller,
  Get,
  Headers,
  Inject,
  Param,
  Req,
  Res,
  NotFoundException,
  ForbiddenException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { LuigiConfigNodesService } from './luigi/luigi-config-nodes/luigi-config-nodes.service';
import { Request, Response } from 'express';
import { HeaderParserService } from '../services/header-parser.service';
import {
  ENTITY_CONTEXT_INJECTION_TOKEN,
  FEATURE_TOGGLES_INJECTION_TOKEN,
  FRAME_CONTEXT_INJECTION_TOKEN,
  TENANT_PROVIDER_INJECTION_TOKEN,
} from '../injection-tokens';
import { TenantService } from '../auth/tenant.service';
import { FrameContextProvider } from './context/frame-context-provider';
import { EntityParams } from './model/entity';
import { FeatureTogglesProvider } from './context/feature-toggles-provider';
import {
  EntityContextProvider,
  EntityContextProviders,
  EntityNotFoundException,
} from './context/entity-context-provider';
import { ModuleRef } from '@nestjs/core';
import { PortalConfig, ServiceProvider } from './model/luigi.node';

@Controller('/rest/config')
export class ConfigController {
  private entityContextProviders: Record<string, EntityContextProvider> = {};

  constructor(
    private logger: Logger,
    private luigiConfigNodesService: LuigiConfigNodesService,
    private headerParser: HeaderParserService,
    @Inject(TENANT_PROVIDER_INJECTION_TOKEN)
    private tenantProvider: TenantService,
    @Inject(FRAME_CONTEXT_INJECTION_TOKEN)
    private frameContextProvider: FrameContextProvider,
    @Inject(ENTITY_CONTEXT_INJECTION_TOKEN)
    entityContextProviders: EntityContextProviders,
    @Inject(FEATURE_TOGGLES_INJECTION_TOKEN)
    private featureTogglesProvider: FeatureTogglesProvider,
    moduleRef: ModuleRef
  ) {
    for (const [entity, eCP] of Object.entries(entityContextProviders)) {
      this.entityContextProviders[entity] = moduleRef.get(eCP);
    }
  }

  @Get()
  async getConfig(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Headers('Accept-language') acceptLanguage: string
  ): Promise<PortalConfig> {
    const providersAndTenantPromise = this.getProvidersAndTenant(
      request,
      acceptLanguage
    ).catch((e: Error) => {
      this.logger.error(e);
      return e;
    });
    const featureTogglePromise = this.featureTogglesProvider
      .getFeatureToggles()
      .catch((e: Error) => {
        this.logger.error(e);
        return e;
      });

    const frameContextPromise = this.frameContextProvider
      .getContextValues(request, response, providersAndTenantPromise)
      .catch((e: Error) => {
        this.logger.error(e);
        return e;
      });

    try {
      const featureToggles = ConfigController.getOrThrow(
        await featureTogglePromise
      );
      const frameContext = ConfigController.getOrThrow(
        await frameContextPromise
      );
      const { tenantId, providers } = ConfigController.getOrThrow(
        await providersAndTenantPromise
      );

      return {
        providers,
        tenantId,
        frameContext,
        featureToggles,
      };
    } catch (e) {
      if (e instanceof ForbiddenException) {
        response.status(HttpStatus.FORBIDDEN);
        return undefined;
      }
      throw e;
    }
  }

  private async getProvidersAndTenant(
    request: Request,
    acceptLanguage: string
  ) {
    const token = this.headerParser.extractBearerToken(request);
    const tenantId = await this.tenantProvider.provideTenant(request);

    const providers = await this.luigiConfigNodesService.getNodes(
      token,
      [],
      acceptLanguage,
      { tenant: tenantId }
    );
    return { tenantId, providers };
  }

  @Get(':entity')
  async getEntityConfig(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param() params: EntityParams,
    @Headers('Accept-language') acceptLanguage: string
  ) {
    const token = this.headerParser.extractBearerToken(request);

    const providersPromise = this.luigiConfigNodesService
      .getNodes(token, [params.entity], acceptLanguage, request.query)
      .catch((e: Error) => {
        this.logger.error(e);
        return e;
      });

    const eCP = this.entityContextProviders[params.entity];
    const entityContextPromise = eCP
      ? eCP.getContextValues(token, request.query).catch((e: Error) => {
          this.logger.error(e);
          return e;
        })
      : Promise.resolve({});

    try {
      return {
        providers: ConfigController.getOrThrow(await providersPromise),
        entityContext: ConfigController.getOrThrow(await entityContextPromise),
      };
    } catch (e) {
      if (e instanceof NotFoundException) {
        response.status(HttpStatus.NOT_FOUND);
        return undefined;
      }
      throw e;
    }
  }

  static getOrThrow<T>(v: T | Error): T {
    if (v instanceof Error) {
      if (v instanceof EntityNotFoundException) {
        throw new NotFoundException();
      }
      throw v;
    }
    return v;
  }
}
