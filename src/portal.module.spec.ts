import { AuthController } from './auth/index.js';
import {
  PortalContextProvider,
  PortalContextProviderImpl,
} from './config/context/portal-context-provider.js';
import { ConfigController } from './config/index.js';
import { EnvController } from './env/index.js';
import { HealthController } from './health/index.js';
import { PORTAL_CONTEXT_INJECTION_TOKEN } from './injection-tokens.js';
import { LocalNodesController } from './local-nodes/index.js';
import { LogoutController } from './logout/index.js';
import { cacheControlNoStore } from './middleware/cache-control.middleware.js';
import { PortalModule } from './portal.module.js';
import { DynamicModule, MiddlewareConsumer, Provider } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';

describe('PortalModule', () => {
  it('should create portal module', () => {
    const portalModule = PortalModule.create({});

    expect(portalModule.controllers).toStrictEqual([
      AuthController,
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
      exclude: ['/rest', '/rest/*path', '/callback'],
      serveStaticOptions: {
        setHeaders: expect.any(Function) as unknown as () => void,
      },
    });

    const portalModule = PortalModule.create({
      frontendDistSources: expectedPath,
    });

    const serveStaticModule = portalModule.imports.filter((e) => {
      return (e as DynamicModule).module.name === 'ServeStaticModule';
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

  describe('configure', () => {
    it('should apply the cookie parser and cache-control middleware to all routes', () => {
      const forRoutes = jest.fn();
      const consumer = {
        apply: jest.fn().mockReturnValue({ forRoutes }),
      } as unknown as MiddlewareConsumer;

      new PortalModule().configure(consumer);

      expect(consumer.apply).toHaveBeenCalledTimes(2);
      expect(consumer.apply).toHaveBeenCalledWith(cacheControlNoStore);
      expect(forRoutes).toHaveBeenCalledTimes(2);
      expect(forRoutes).toHaveBeenCalledWith('*');
    });
  });

  describe('static asset cache policy', () => {
    const setHeadersFor = (path: string) => {
      const portalModule = PortalModule.create({
        frontendDistSources: 'test',
      });
      const serveStaticModule = portalModule.imports.find(
        (e) => (e as DynamicModule).module.name === 'ServeStaticModule',
      ) as DynamicModule;
      const optionsProvider = serveStaticModule.providers.find(
        (provider) =>
          typeof provider === 'object' &&
          provider !== null &&
          'useValue' in provider,
      ) as {
        useValue: {
          serveStaticOptions: {
            setHeaders: (res: any, path: string) => void;
          };
        }[];
      };
      const res = { setHeader: jest.fn() };
      optionsProvider.useValue[0].serveStaticOptions.setHeaders(res, path);
      return res.setHeader;
    };

    it('should never store html documents', () => {
      expect(setHeadersFor('/dist/index.html')).toHaveBeenCalledWith(
        'Cache-Control',
        'no-store',
      );
    });

    it('should cache hashed bundles immutably', () => {
      expect(setHeadersFor('/dist/main-A1B2C3D4.js')).toHaveBeenCalledWith(
        'Cache-Control',
        'public, max-age=31536000, immutable',
      );
    });

    it('should revalidate all other assets', () => {
      expect(setHeadersFor('/dist/assets/logo.svg')).toHaveBeenCalledWith(
        'Cache-Control',
        'no-cache',
      );
    });
  });
});
