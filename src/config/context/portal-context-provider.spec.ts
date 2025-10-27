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
    customProvider = mock<PortalContextProvider>();
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
    it('should return empty object when no environment variables are set', async () => {
      const result = await service.getContextValues(requestMock, responseMock);
      expect(result).toEqual({});
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
      });
    });

    it('should merge with custom provider context when available', async () => {
      process.env.OPENMFP_PORTAL_CONTEXT_API_URL = 'https://api.example.com';

      const customContext = {
        customValue: 'custom',
        anotherValue: 'another',
      };

      (customProvider.getContextValues as jest.Mock).mockResolvedValue(
        customContext,
      );

      const result = await service.getContextValues(requestMock, responseMock);

      expect(result).toEqual({
        apiUrl: 'https://api.example.com',
        customValue: 'custom',
        anotherValue: 'another',
      });
      expect(customProvider.getContextValues as jest.Mock).toHaveBeenCalledWith(
        requestMock,
        responseMock,
      );
    });

    it('should prioritize custom provider values over environment variables', async () => {
      process.env.OPENMFP_PORTAL_CONTEXT_API_URL = 'https://api.example.com';
      process.env.OPENMFP_PORTAL_CONTEXT_DEBUG_MODE = 'true';

      const customContext = {
        apiUrl: 'https://custom.api.com', // This should override env var
        customValue: 'custom',
      };

      (customProvider.getContextValues as jest.Mock).mockResolvedValue(
        customContext,
      );

      const result = await service.getContextValues(requestMock, responseMock);

      expect(result).toEqual({
        apiUrl: 'https://custom.api.com', // Custom value should win
        debugMode: 'true', // Env var not overridden
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

  describe('camelCase conversion through environment variables', () => {
    it('should convert environment variable names to camelCase', async () => {
      process.env.OPENMFP_PORTAL_CONTEXT_API_URL = 'https://api.example.com';
      process.env.OPENMFP_PORTAL_CONTEXT_DEBUG_MODE_ENABLED = 'true';
      process.env.OPENMFP_PORTAL_CONTEXT_SOME_VERY_LONG_NAME = 'test';
      process.env.OPENMFP_PORTAL_CONTEXT_SINGLE = 'value';

      const result = await service.getContextValues(requestMock, responseMock);

      expect(result).toEqual({
        apiUrl: 'https://api.example.com',
        debugModeEnabled: 'true',
        someVeryLongName: 'test',
        single: 'value',
      });
    });

    it('should handle single character environment variable names', async () => {
      process.env.OPENMFP_PORTAL_CONTEXT_A = 'value1';
      process.env.OPENMFP_PORTAL_CONTEXT_B = 'value2';

      const result = await service.getContextValues(requestMock, responseMock);

      expect(result).toEqual({
        a: 'value1',
        b: 'value2',
      });
    });

    it('should handle empty environment variable names after prefix removal', async () => {
      process.env.OPENMFP_PORTAL_CONTEXT_ = 'should be ignored';
      process.env.OPENMFP_PORTAL_CONTEXT_VALID_KEY = 'valid value';

      const result = await service.getContextValues(requestMock, responseMock);

      expect(result).toEqual({
        validKey: 'valid value',
      });
    });
  });
});
