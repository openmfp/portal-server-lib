import { EnvService } from '../../env/index.js';
import { OpenmfpPortalContextService } from './openmfp-portal-context.service.js';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import process from 'node:process';

describe('OpenmfpPortalContextService', () => {
  let service: OpenmfpPortalContextService;
  let envService: EnvService;
  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = { ...originalEnv };

    const mockEnvService = {
      getDomain: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenmfpPortalContextService,
        { provide: EnvService, useValue: mockEnvService },
      ],
    }).compile();

    service = module.get<OpenmfpPortalContextService>(
      OpenmfpPortalContextService,
    );
    envService = module.get<EnvService>(EnvService);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getContextValues', () => {
    it('should extract environment variables with OPENMFP_PORTAL_CONTEXT_ prefix', async () => {
      process.env.OPENMFP_PORTAL_CONTEXT_API_URL = 'http://api.example.com';
      process.env.OPENMFP_PORTAL_CONTEXT_USER_NAME = 'testuser';
      process.env.OPENMFP_PORTAL_CONTEXT_SOME_LONG_VALUE = 'longvalue';
      process.env.OTHER_ENV_VAR = 'should not be included';

      const mockRequest = {} as Request;
      jest.spyOn(service, 'addGraphQLGatewayApiUrl').mockImplementation();

      const result = await service.getContextValues(mockRequest);

      expect(result).toEqual({
        apiUrl: 'http://api.example.com',
        userName: 'testuser',
        someLongValue: 'longvalue',
      });
      expect(service.addGraphQLGatewayApiUrl).toHaveBeenCalledWith(
        mockRequest,
        result,
      );
    });

    it('should ignore environment variables with empty key names', async () => {
      process.env.OPENMFP_PORTAL_CONTEXT_ = 'empty';
      process.env.OPENMFP_PORTAL_CONTEXT_VALID_KEY = 'valid';

      const mockRequest = {} as Request;
      jest.spyOn(service, 'addGraphQLGatewayApiUrl').mockImplementation();

      const result = await service.getContextValues(mockRequest);

      expect(result).toEqual({
        validKey: 'valid',
      });
    });
  });

  describe('addGraphQLGatewayApiUrl', () => {
    it('should properly format gateway URL when hostname matches domain', () => {
      const mockRequest = {
        hostname: 'example.com',
      } as Request;

      const context = {};
      process.env.KUBERNETES_GRAPHQL_GATEWAY_API_URL =
        'https://${org-subdomain}api.${org-name}.example.com';

      jest.spyOn(envService, 'getDomain').mockReturnValue({
        domain: 'example.com',
        idpName: 'test-org',
      });

      service.addGraphQLGatewayApiUrl(mockRequest, context);

      expect(context).toEqual({
        crdGatewayApiUrl: 'https://api.test-org.example.com',
      });
    });

    it('should properly format gateway URL when hostname does not match domain', () => {
      const mockRequest = {
        hostname: 'subdomain.example.com',
      } as Request;

      const context = {};
      process.env.KUBERNETES_GRAPHQL_GATEWAY_API_URL =
        'https://${org-subdomain}api.${org-name}.example.com';

      jest.spyOn(envService, 'getDomain').mockReturnValue({
        domain: 'example.com',
        idpName: 'test-org',
      });

      service.addGraphQLGatewayApiUrl(mockRequest, context);

      expect(context).toEqual({
        crdGatewayApiUrl: 'https://test-org.api.test-org.example.com',
      });
    });

    it('should handle undefined KUBERNETES_GRAPHQL_GATEWAY_API_URL', () => {
      const mockRequest = {
        hostname: 'example.com',
      } as Request;

      const context = {};
      process.env.KUBERNETES_GRAPHQL_GATEWAY_API_URL = undefined;

      jest.spyOn(envService, 'getDomain').mockReturnValue({
        domain: 'example.com',
        idpName: 'test-org',
      });

      service.addGraphQLGatewayApiUrl(mockRequest, context);

      expect(context).toEqual({
        crdGatewayApiUrl: undefined,
      });
    });
  });

  describe('toCamelCase', () => {
    it('should convert snake_case to camelCase', () => {
      const result = service['toCamelCase']('TEST_SNAKE_CASE_STRING');
      expect(result).toBe('testSnakeCaseString');
    });

    it('should handle single word', () => {
      const result = service['toCamelCase']('SINGLE');
      expect(result).toBe('single');
    });
  });

  describe('capitalizeFirstLetter', () => {
    it('should capitalize first letter', () => {
      const result = service['capitalizeFirstLetter']('test');
      expect(result).toBe('Test');
    });

    it('should handle empty string', () => {
      const result = service['capitalizeFirstLetter']('');
      expect(result).toBe('');
    });
  });
});
