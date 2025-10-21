import { AuthController } from './auth/index.js';
import { ConfigController } from './config/index.js';
import { EnvController } from './env/index.js';
import { HealthController } from './health/index.js';
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
      return (e as DynamicModule).module.name === 'ServeStaticModule';
    });

    expect(
      serveStaticModule.map((e) => (e as DynamicModule).providers),
    ).toStrictEqual([expectedModule.providers]);
  });
});
