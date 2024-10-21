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
  UseGuards,
} from '@nestjs/common';
import { LuigiConfigNodesService } from './luigi/luigi-config-nodes/luigi-config-nodes.service';
import { Request, Response } from 'express';
import { HeaderParserService } from '../services';
import {
  ENTITY_CONTEXT_INJECTION_TOKEN,
  FEATURE_TOGGLES_INJECTION_TOKEN,
  PORTAL_CONTEXT_INJECTION_TOKEN,
} from '../injection-tokens';
import { PortalContextProvider } from './context/portal-context-provider';
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
    const providersPromise = this.getProviders(request, acceptLanguage).catch(
      (e: Error) => {
        this.logger.error(e);
        return e;
      }
    );
    const featureTogglePromise = this.featureTogglesProvider
      .getFeatureToggles()
      .catch((e: Error) => {
        this.logger.error(e);
        return e;
      });

    const portalContextPromise = this.portalContextProvider
      .getContextValues(request, response, providersPromise)
      .catch((e: Error) => {
        this.logger.error(e);
        return e;
      });

    try {
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
    } catch (e) {
      if (e instanceof ForbiddenException) {
        response.status(HttpStatus.FORBIDDEN);
        return undefined;
      }
      throw e;
    }
  }

  private async getProviders(
    request: Request,
    acceptLanguage: string
  ): Promise<ServiceProvider[]> {
    const token = this.headerParser.extractBearerToken(request);

    const providers = await this.luigiConfigNodesService.getNodes(
      token,
      [],
      acceptLanguage
    );
    return providers;
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
