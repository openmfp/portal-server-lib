import { EnvService } from '../../env/index.js';
import { OpenmfpPortalContextService } from './openmfp-portal-context.service.js';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';

describe('OpenmfpPortalContextService', () => {
  let service: OpenmfpPortalContextService;
  let envService: jest.Mocked<EnvService>;
  let mockRequest: Partial<Request>;

  beforeEach(async () => {
    const envServiceMock = {
      getDomain: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenmfpPortalContextService,
        {
          provide: EnvService,
          useValue: envServiceMock,
        },
      ],
    }).compile();

    service = module.get<OpenmfpPortalContextService>(
      OpenmfpPortalContextService,
    );
    envService = module.get(EnvService);

    mockRequest = {
      hostname: 'test.example.com',
    };

    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return empty context when no environment variables match prefix', async () => {
    envService.getDomain.mockReturnValue({
      domain: 'example.com',
      idpName: 'test-org',
    });

    const result = await service.getContextValues(mockRequest as Request);

    expect(result).toEqual({});
  });

  it('should process environment variables with correct prefix', async () => {
    process.env.OPENMFP_PORTAL_CONTEXT_TEST_KEY = 'test-value';
    process.env.OPENMFP_PORTAL_CONTEXT_ANOTHER_TEST_KEY = 'another-value';
    process.env.OTHER_ENV_VAR = 'should-be-ignored';

    try {
      envService.getDomain.mockReturnValue({
        domain: 'example.com',
        idpName: 'test-org',
      });

      const result = await service.getContextValues(mockRequest as Request);

      expect(result).toEqual({
        testKey: 'test-value',
        anotherTestKey: 'another-value',
      });
    } finally {
      delete process.env.OPENMFP_PORTAL_CONTEXT_TEST_KEY;
      delete process.env.OPENMFP_PORTAL_CONTEXT_ANOTHER_TEST_KEY;
      delete process.env.OTHER_ENV_VAR;
    }
  });

  it('should convert snake_case to camelCase', async () => {
    process.env.OPENMFP_PORTAL_CONTEXT_SNAKE_CASE_KEY = 'value';
    process.env.OPENMFP_PORTAL_CONTEXT_MULTIPLE_SNAKE_CASE_KEYS = 'value2';

    try {
      envService.getDomain.mockReturnValue({
        domain: 'example.com',
        idpName: 'test-org',
      });

      const result = await service.getContextValues(mockRequest as Request);

      expect(result).toEqual({
        snakeCaseKey: 'value',
        multipleSnakeCaseKeys: 'value2',
      });
    } finally {
      delete process.env.OPENMFP_PORTAL_CONTEXT_SNAKE_CASE_KEY;
      delete process.env.OPENMFP_PORTAL_CONTEXT_MULTIPLE_SNAKE_CASE_KEYS;
    }
  });

  it('should process GraphQL gateway API URL with subdomain when hostname differs from domain', async () => {
    process.env.OPENMFP_PORTAL_CONTEXT_CRD_GATEWAY_API_URL =
      'https://${org-subdomain}api.example.com/${org-name}/graphql';

    try {
      envService.getDomain.mockReturnValue({
        domain: 'example.com',
        idpName: 'test-org',
      });

      mockRequest.hostname = 'subdomain.example.com';

      const result = await service.getContextValues(mockRequest as Request);

      expect(result.crdGatewayApiUrl).toBe(
        'https://test-org.api.example.com/test-org/graphql',
      );
    } finally {
      delete process.env.OPENMFP_PORTAL_CONTEXT_CRD_GATEWAY_API_URL;
    }
  });

  it('should process GraphQL gateway API URL without subdomain when hostname matches domain', async () => {
    process.env.OPENMFP_PORTAL_CONTEXT_CRD_GATEWAY_API_URL =
      'https://${org-subdomain}api.example.com/${org-name}/graphql';

    try {
      envService.getDomain.mockReturnValue({
        domain: 'example.com',
        idpName: 'test-org',
      });

      mockRequest.hostname = 'example.com';

      const result = await service.getContextValues(mockRequest as Request);

      expect(result.crdGatewayApiUrl).toBe(
        'https://api.example.com/test-org/graphql',
      );
    } finally {
      delete process.env.OPENMFP_PORTAL_CONTEXT_CRD_GATEWAY_API_URL;
    }
  });

  it('should ignore keys with empty names after trimming', async () => {
    process.env.OPENMFP_PORTAL_CONTEXT_ = 'should-be-ignored';
    process.env['OPENMFP_PORTAL_CONTEXT_   '] = 'should-also-be-ignored';
    process.env.OPENMFP_PORTAL_CONTEXT_VALID_KEY = 'valid-value';

    try {
      envService.getDomain.mockReturnValue({
        domain: 'example.com',
        idpName: 'test-org',
      });

      const result = await service.getContextValues(mockRequest as Request);

      expect(result).toEqual({
        validKey: 'valid-value',
      });
    } finally {
      delete process.env.OPENMFP_PORTAL_CONTEXT_;
      delete process.env['OPENMFP_PORTAL_CONTEXT_   '];
      delete process.env.OPENMFP_PORTAL_CONTEXT_VALID_KEY;
    }
  });

  it('should handle undefined crdGatewayApiUrl gracefully', async () => {
    process.env.OPENMFP_PORTAL_CONTEXT_OTHER_KEY = 'value';

    try {
      envService.getDomain.mockReturnValue({
        domain: 'example.com',
        idpName: 'test-org',
      });

      const result = await service.getContextValues(mockRequest as Request);

      expect(result).toEqual({
        otherKey: 'value',
      });
    } finally {
      delete process.env.OPENMFP_PORTAL_CONTEXT_OTHER_KEY;
    }
  });
});
