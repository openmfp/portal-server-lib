import { EnvService } from '../../env/index.js';
import { OpenmfpPortalContextService } from './openmfp-portal-context.service.js';
import type { Request } from 'express';

describe('OpenmfpPortalContextService', () => {
  let service: OpenmfpPortalContextService;
  let envServiceMock: jest.Mocked<EnvService>;

  beforeEach(() => {
    envServiceMock = {
      getDomain: jest.fn(),
    } as unknown as jest.Mocked<EnvService>;

    service = new OpenmfpPortalContextService(envServiceMock);
  });

  afterEach(() => {
    jest.resetAllMocks();
    Object.keys(process.env).forEach((key) => {
      if (key.startsWith('OPENMFP_PORTAL_CONTEXT_')) {
        delete process.env[key];
      }
    });
    delete process.env.KUBERNETES_GRAPHQL_GATEWAY_API_URL;
  });

  it('should return context values from process.env with camelCase keys', async () => {
    process.env.OPENMFP_PORTAL_CONTEXT_HELLO_WORLD = '123';
    process.env.OPENMFP_PORTAL_CONTEXT_ANOTHER_KEY = '456';

    envServiceMock.getDomain.mockReturnValue({
      domain: 'portal.dev.local',
      idpName: 'sub',
    });

    const mockRequest = { hostname: 'portal.dev.local' } as Request;
    const result = await service.getContextValues(mockRequest);

    expect(result).toEqual(
      expect.objectContaining({
        helloWorld: '123',
        anotherKey: '456',
      }),
    );
  });

  it('should include crdGatewayApiUrl with replaced subdomain', async () => {
    process.env.KUBERNETES_GRAPHQL_GATEWAY_API_URL =
      'https://gateway.${org-subdomain}portal.dev.local';

    envServiceMock.getDomain.mockReturnValue({
      domain: 'portal.dev.local',
      idpName: 'sub',
    });

    const mockRequest = { hostname: 'sub.portal.dev.local' } as Request;
    const result = await service.getContextValues(mockRequest);

    expect(result.crdGatewayApiUrl).toBe(
      'https://gateway.sub.portal.dev.local',
    );
  });

  it('should use empty subdomain if hostname equals org domain', async () => {
    process.env.KUBERNETES_GRAPHQL_GATEWAY_API_URL =
      'https://gateway.${org-subdomain}portal.dev.local';

    envServiceMock.getDomain.mockReturnValue({
      domain: 'portal.dev.local',
      idpName: 'sub',
    });

    const mockRequest = { hostname: 'portal.dev.local' } as Request;
    const result = await service.getContextValues(mockRequest);

    expect(result.crdGatewayApiUrl).toBe('https://gateway.portal.dev.local');
  });
});
