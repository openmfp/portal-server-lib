import { AuthConfigProvider, ServerAuthVariables } from '../auth/index.js';
import { EnvVariablesServiceImpl } from './env-variables.service.js';
import { EnvService } from './env.service.js';
import type { Request, Response } from 'express';
import { mock } from 'jest-mock-extended';

describe('EnvVariablesServiceImpl', () => {
  let envVariablesService: EnvVariablesServiceImpl;
  let envServiceMock: EnvService;
  let authConfigServiceMock: jest.Mocked<AuthConfigProvider>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  const currentAuthEnv: ServerAuthVariables = {
    oauthServerUrl: 'oauthServerUrl',
    oauthTokenUrl: 'oauthTokenUrl',
    oidcIssuerUrl: 'oidcIssuerUrl',
    clientId: 'clientId',
    idpName: 'idpName',
    baseDomain: 'baseDomain',
    clientSecret: 'clientSecret',
  };

  const env = {
    validWebcomponentUrls: 'validWebcomponentUrls',
    logoutRedirectUrl: 'logoutRedirectUrl',
    isLocal: true,
    developmentInstance: true,
    uiOptions: 'uiOptions',
  };

  beforeEach(() => {
    envServiceMock = {
      getEnv: jest.fn().mockReturnValue(env),
    } as any;

    authConfigServiceMock = mock();
    authConfigServiceMock.getAuthConfig.mockResolvedValue(currentAuthEnv);

    envVariablesService = new EnvVariablesServiceImpl(
      envServiceMock,
      authConfigServiceMock,
    );

    mockRequest = {};
    mockResponse = {};
  });

  describe('getEnv', () => {
    it('should return the result from authDataService.provideAuthData and current auth envs', async () => {
      const result = await envVariablesService.getEnv(
        mockRequest,
        mockResponse,
      );

      expect(result).toEqual({
        idpName: 'idpName',
        baseDomain: 'baseDomain',
        oauthServerUrl: 'oauthServerUrl',
        oauthTokenUrl: 'oauthTokenUrl',
        oidcIssuerUrl: 'oidcIssuerUrl',
        clientId: 'clientId',
        validWebcomponentUrls: 'validWebcomponentUrls',
        logoutRedirectUrl: 'logoutRedirectUrl',
        isLocal: true,
        developmentInstance: true,
        uiOptions: 'uiOptions',
      });
    });

    it('should return a promise', () => {
      const result = envVariablesService.getEnv(mockRequest, mockResponse);
      expect(result).toBeInstanceOf(Promise);
    });

    it('should handle empty auth config values', async () => {
      const emptyAuthConfig: ServerAuthVariables = {};
      authConfigServiceMock.getAuthConfig.mockResolvedValue(emptyAuthConfig);

      const result = await envVariablesService.getEnv(
        mockRequest,
        mockResponse,
      );

      expect(result).toEqual({
        idpName: undefined,
        baseDomain: undefined,
        oauthServerUrl: undefined,
        oauthTokenUrl: undefined,
        oidcIssuerUrl: undefined,
        clientId: undefined,
        validWebcomponentUrls: 'validWebcomponentUrls',
        logoutRedirectUrl: 'logoutRedirectUrl',
        isLocal: true,
        developmentInstance: true,
        uiOptions: 'uiOptions',
      });
    });

    it('should handle partial auth config values', async () => {
      const partialAuthConfig: ServerAuthVariables = {
        idpName: 'test-idp',
        baseDomain: 'test.com',
      };
      authConfigServiceMock.getAuthConfig.mockResolvedValue(partialAuthConfig);

      const result = await envVariablesService.getEnv(
        mockRequest,
        mockResponse,
      );

      expect(result).toEqual({
        idpName: 'test-idp',
        baseDomain: 'test.com',
        oauthServerUrl: undefined,
        oauthTokenUrl: undefined,
        oidcIssuerUrl: undefined,
        clientId: undefined,
        validWebcomponentUrls: 'validWebcomponentUrls',
        logoutRedirectUrl: 'logoutRedirectUrl',
        isLocal: true,
        developmentInstance: true,
        uiOptions: 'uiOptions',
      });
    });
  });
});
