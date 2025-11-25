import { AuthController, GoogleAuthController } from './auth/index.js';
import {
  PortalContextProvider,
  PortalContextProviderImpl,
} from './config/index.js';
import { ConfigController } from './config/index.js';
import { EnvController } from './env/index.js';
import { HealthController } from './health/index.js';
import { PORTAL_CONTEXT_INJECTION_TOKEN } from './injection-tokens.js';
import { LocalNodesController } from './local-nodes/index.js';
import { LogoutController } from './logout/index.js';
import { PortalModule } from './portal.module.js';
import { DynamicModule, Provider } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';

describe('PortalModule', () => {
  it('should create portal module', () => {
    const portalModule = PortalModule.create({});

    expect(portalModule.controllers).toStrictEqual([
      AuthController,
      GoogleAuthController,
      HealthController,
      LocalNodesController,
      EnvController,
      LogoutController,
      ConfigController,
    ]);
  });

  it('should add additional controllers', () => {
    const testController: any = 'testController';
    const portalModule = PortalModule.create({
      additionalControllers: [testController],
    });

    expect(portalModule.controllers).toContain(testController);
  });

  it('should add additional providers', () => {
    const testProvider: Provider = null;
    const portalModule = PortalModule.create({
      additionalProviders: [testProvider],
    });

    expect(portalModule.providers).toContain(testProvider);
  });

  it('should set frontendDistSources', () => {
    const expectedPath = 'test';

    const expectedModule = ServeStaticModule.forRoot({
      rootPath: expectedPath,
      exclude: ['/rest', '/callback'],
    });

    const portalModule = PortalModule.create({
      frontendDistSources: expectedPath,
    });

    const serveStaticModule = portalModule.imports.filter((e) => {
      return (e as DynamicModule).module?.name === 'ServeStaticModule';
    });

    expect(
      serveStaticModule.map((e) => (e as DynamicModule).providers),
    ).toStrictEqual([expectedModule.providers]);
  });

  describe('PortalContextProvider configuration', () => {
    it('should include PortalContextProviderImpl in providers by default', () => {
      const portalModule = PortalModule.create({});

      const portalContextProviderImpl = portalModule.providers.find(
        (provider) => provider === PortalContextProviderImpl,
      );

      expect(portalContextProviderImpl).toBeDefined();
    });

    it('should not include PORTAL_CONTEXT_INJECTION_TOKEN provider by default', () => {
      const portalModule = PortalModule.create({});

      const portalContextTokenProvider = portalModule.providers.find(
        (provider) =>
          typeof provider === 'object' &&
          provider !== null &&
          'provide' in provider &&
          provider.provide === PORTAL_CONTEXT_INJECTION_TOKEN,
      );

      expect(portalContextTokenProvider).toBeUndefined();
    });

    it('should add custom portalContextProvider when provided', () => {
      class CustomPortalContextProvider implements PortalContextProvider {
        async getContextValues(): Promise<Record<string, any>> {
          return { custom: 'value' };
        }
      }

      const portalModule = PortalModule.create({
        portalContextProvider: CustomPortalContextProvider,
      });

      const portalContextProviderImpl = portalModule.providers.find(
        (provider) => provider === PortalContextProviderImpl,
      );

      const customProvider = portalModule.providers.find(
        (provider) =>
          typeof provider === 'object' &&
          provider !== null &&
          'provide' in provider &&
          provider.provide === PORTAL_CONTEXT_INJECTION_TOKEN,
      );

      expect(portalContextProviderImpl).toBeDefined();
      expect(customProvider).toBeDefined();
      expect(customProvider).toEqual({
        provide: PORTAL_CONTEXT_INJECTION_TOKEN,
        useClass: CustomPortalContextProvider,
      });
    });
  });
});
