import { AuthConfigService, ServerAuthVariables } from '../auth/index.js';
import {
  AUTH_CONFIG_INJECTION_TOKEN,
  ENV_VARIABLES_PROVIDER_INJECTION_TOKEN,
} from '../injection-tokens.js';
import { EnvVariablesService } from './env-variables.service.js';
import { EnvController } from './env.controller.js';
import { EnvService } from './env.service.js';
import { Test, TestingModule } from '@nestjs/testing';
import type { Request, Response } from 'express';

describe('EnvController', () => {
  let controller: EnvController;
  let authConfigService: jest.Mocked<AuthConfigService>;
  let envVariablesProvider: jest.Mocked<EnvVariablesService>;
  let envService: jest.Mocked<EnvService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnvController],
      providers: [
        {
          provide: AUTH_CONFIG_INJECTION_TOKEN,
          useValue: {
            getAuthConfig: jest.fn(),
          },
        },
        {
          provide: ENV_VARIABLES_PROVIDER_INJECTION_TOKEN,
          useValue: {
            getEnv: jest.fn(),
          },
        },
        {
          provide: EnvService,
          useValue: {
            getEnv: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<EnvController>(EnvController);
    authConfigService = module.get(AUTH_CONFIG_INJECTION_TOKEN);
    envVariablesProvider = module.get(ENV_VARIABLES_PROVIDER_INJECTION_TOKEN);
    envService = module.get(EnvService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should merge env service, provider, and auth config values', async () => {
    const req = {} as Request;
    const res = {} as Response;

    envService.getEnv.mockReturnValue({
      envA: 'a',
      envB: 'b',
    } as any);

    envVariablesProvider.getEnv.mockResolvedValue({
      customA: 'x',
      customB: 'y',
    } as any);

    authConfigService.getAuthConfig.mockResolvedValue({
      oauthServerUrl: 'srv',
      oauthTokenUrl: 'token',
      oidcIssuerUrl: 'issuer',
      clientId: 'client',
      clientSecret: 'clientSecret',
      idpName: 'idp',
      baseDomain: 'domain',
    });

    const result = await controller.getEnv(req, res);

    expect(envService.getEnv).toHaveBeenCalled();
    expect(envVariablesProvider.getEnv).toHaveBeenCalledWith(req, res);
    expect(authConfigService.getAuthConfig).toHaveBeenCalledWith(req);

    expect(result).toEqual({
      envA: 'a',
      envB: 'b',
      customA: 'x',
      customB: 'y',
      oauthServerUrl: 'srv',
      oidcIssuerUrl: 'issuer',
      clientId: 'client',
    });
  });

  it('should allow empty provider and env responses', async () => {
    const req = {} as Request;
    const res = {} as Response;

    envService.getEnv.mockReturnValue({});
    envVariablesProvider.getEnv.mockResolvedValue({});
    authConfigService.getAuthConfig.mockResolvedValue({
      oauthServerUrl: undefined,
      oauthTokenUrl: undefined,
      oidcIssuerUrl: undefined,
      clientId: undefined,
      clientSecret: undefined,
      idpName: undefined,
      baseDomain: undefined,
    });

    const result = await controller.getEnv(req, res);

    expect(result).toEqual({});
  });

  it('should return a plain object', async () => {
    const req = {} as Request;
    const res = {} as Response;

    envService.getEnv.mockReturnValue({});
    envVariablesProvider.getEnv.mockResolvedValue({});
    authConfigService.getAuthConfig.mockResolvedValue(
      {} as ServerAuthVariables,
    );

    const result = await controller.getEnv(req, res);

    expect(typeof result).toBe('object');
  });
});
