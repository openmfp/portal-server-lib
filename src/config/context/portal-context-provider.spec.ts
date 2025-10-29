import { PORTAL_CONTEXT_INJECTION_TOKEN } from '../../injection-tokens.js';
import {
  PortalContextProvider,
  PortalContextProviderImpl,
} from './portal-context-provider.js';
import { Test, TestingModule } from '@nestjs/testing';
import type { Request, Response } from 'express';
import { mock } from 'jest-mock-extended';

describe('PortalContextProviderImpl', () => {
  let service: PortalContextProviderImpl;
  let customProvider: PortalContextProvider;
  let requestMock: Request;
  let responseMock: Response;

  beforeEach(async () => {
    customProvider = mock<PortalContextProvider>({
      getContextValues: (request, response, portalContext) => {
        portalContext.customValue = 'custom';
        return Promise.resolve(portalContext);
      },
    });

    requestMock = mock<Request>();
    responseMock = mock<Response>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortalContextProviderImpl,
        {
          provide: PORTAL_CONTEXT_INJECTION_TOKEN,
          useValue: customProvider,
        },
      ],
    }).compile();

    service = module.get<PortalContextProviderImpl>(PortalContextProviderImpl);

    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up environment variables
    Object.keys(process.env).forEach((key) => {
      if (key.startsWith('OPENMFP_PORTAL_CONTEXT_')) {
        delete process.env[key];
      }
    });
  });

  describe('getContextValues', () => {
    it('should return only cutsom provider context when no environment variables are set', async () => {
      const result = await service.getContextValues(requestMock, responseMock);
      expect(result).toEqual({
        customValue: 'custom',
      });
    });

    it('should return environment variables with OPENMFP_PORTAL_CONTEXT_ prefix', async () => {
      process.env.OPENMFP_PORTAL_CONTEXT_API_URL = 'https://api.example.com';
      process.env.OPENMFP_PORTAL_CONTEXT_DEBUG_MODE = 'true';
      process.env.OPENMFP_PORTAL_CONTEXT_SOME_VALUE = 'test';

      const result = await service.getContextValues(requestMock, responseMock);

      expect(result).toEqual({
        apiUrl: 'https://api.example.com',
        debugMode: 'true',
        someValue: 'test',
        customValue: 'custom',
      });
    });

    it('should add custom provider context when available', async () => {
      process.env.OPENMFP_PORTAL_CONTEXT_API_URL = 'https://api.example.com';
      const result = await service.getContextValues(requestMock, responseMock);

      expect(result).toEqual({
        apiUrl: 'https://api.example.com',
        customValue: 'custom',
      });
    });

    it('should return only environment variables when no custom provider', async () => {
      const moduleWithoutCustom: TestingModule = await Test.createTestingModule(
        {
          providers: [PortalContextProviderImpl],
        },
      ).compile();

      const serviceWithoutCustom =
        moduleWithoutCustom.get<PortalContextProviderImpl>(
          PortalContextProviderImpl,
        );

      process.env.OPENMFP_PORTAL_CONTEXT_API_URL = 'https://api.example.com';

      const result = await serviceWithoutCustom.getContextValues(
        requestMock,
        responseMock,
      );

      expect(result).toEqual({
        apiUrl: 'https://api.example.com',
      });
    });
  });
});
