import { EnvVariablesServiceImpl } from './env-variables.service.js';
import { EnvService, ServerAuthVariables } from './env.service.js';
import type { Request, Response } from 'express';

describe('EnvVariablesServiceImpl', () => {
  let envVariablesService: EnvVariablesServiceImpl;
  let envServiceMock: EnvService;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  const currentAuthEnv: ServerAuthVariables = {
    oauthServerUrl: 'oauthServerUrl',
    oauthTokenUrl: 'oauthTokenUrl',
    clientId: 'clientId',
    idpName: 'idpName',
    baseDomain: 'baseDomain',
    organization: 'organization',
    clientSecret: 'clientSecret',
  };

  const env = {
    validWebcomponentUrls: 'validWebcomponentUrls',
    logoutRedirectUrl: 'logoutRedirectUrl',
    isLocal: true,
    developmentInstance: true,
  };

  beforeEach(() => {
    envServiceMock = {
      getCurrentAuthEnv: jest.fn().mockReturnValue(currentAuthEnv),
      getEnv: jest.fn().mockReturnValue(env),
    } as any;

    envVariablesService = new EnvVariablesServiceImpl(envServiceMock);

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
        organization: 'organization',
        oauthServerUrl: 'oauthServerUrl',
        oauthTokenUrl: 'oauthTokenUrl',
        clientId: 'clientId',
        validWebcomponentUrls: 'validWebcomponentUrls',
        logoutRedirectUrl: 'logoutRedirectUrl',
        isLocal: true,
        developmentInstance: true,
      });
    });

    it('should return a promise', () => {
      const result = envVariablesService.getEnv(mockRequest, mockResponse);
      expect(result).toBeInstanceOf(Promise);
    });
  });
});
