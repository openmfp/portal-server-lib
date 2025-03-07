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
  Logger,
} from '@nestjs/common';
import { LuigiConfigNodesService } from './luigi/luigi-config-nodes/luigi-config-nodes.service';
import { Request, Response } from 'express';
import { HeaderParserService } from '../services';
import {
  ENTITY_CONTEXT_INJECTION_TOKEN,
  FEATURE_TOGGLES_INJECTION_TOKEN,
  PORTAL_CONTEXT_INJECTION_TOKEN,
} from '../injection-tokens';
import { OpenmfpPortalContextService } from './context/openmfp-portal-context.service';
import { EntityParams } from './model/entity';
import { FeatureTogglesProvider } from './context/feature-toggles-provider';
import {
  EntityAccessForbiddenException,
  EntityContextProvider,
  EntityContextProviders,
  EntityNotFoundException,
} from './context/entity-context-provider';
import { ModuleRef } from '@nestjs/core';
import { PortalConfig } from './model/luigi.node';

@Controller('/rest/config')
export class ConfigController {
  private entityContextProviders: Record<string, EntityContextProvider> = {};

  constructor(
    private logger: Logger,
    private luigiConfigNodesService: LuigiConfigNodesService,
    private headerParser: HeaderParserService,
    private openmfpPortalContextService: OpenmfpPortalContextService,
    @Inject(PORTAL_CONTEXT_INJECTION_TOKEN)
    private portalContextProvider: PortalContextProvider,
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
    const token = this.headerParser.extractBearerToken(request);

    const providersPromise = this.luigiConfigNodesService
      .getNodes(token, [], acceptLanguage)
      .catch((e: Error) => {
        this.logger.error(e);
        return e;
      });

    const featureTogglePromise = this.featureTogglesProvider
      .getFeatureToggles()
      .catch((e: Error) => {
        this.logger.error(e);
        return e;
      });

    const portalContextPromise = this.openmfpPortalContextService
      .getContextValues()
      .catch((e: Error) => {
        this.logger.error(e);
        return e;
      });

    const featureToggles = ConfigController.getOrThrow(
      await featureTogglePromise
    );
    const portalContext = ConfigController.getOrThrow(
      await portalContextPromise
    );
    const providers = ConfigController.getOrThrow(await providersPromise);

    return {
      providers,
      portalContext,
      featureToggles,
    };
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

    return {
      providers: ConfigController.getOrThrow(await providersPromise),
      entityContext: ConfigController.getOrThrow(await entityContextPromise),
    };
  }

  static getOrThrow<T>(v: T | Error): T {
    if (v instanceof Error) {
      if (v instanceof EntityNotFoundException) {
        throw new NotFoundException(v);
      } else if (v instanceof EntityAccessForbiddenException) {
        throw new ForbiddenException(v);
      }
      throw v;
    }
    return v;
  }
}
