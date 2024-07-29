import { Test, TestingModule } from '@nestjs/testing';
import { DiscoveryService } from './discovery.service';
import { HttpService } from '@nestjs/axios';
import { mock } from 'jest-mock-extended';
import { of, throwError } from 'rxjs';
import { AxiosError } from 'axios';

describe('DiscoveryService', () => {
  let service: DiscoveryService;
  let httpServiceMock: HttpService;

  beforeEach(async () => {
    httpServiceMock = mock<HttpService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [DiscoveryService, HttpService],
    })
      .overrideProvider(HttpService)
      .useValue(httpServiceMock)
      .compile();

    service = module.get<DiscoveryService>(DiscoveryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('getOIDC', () => {
    beforeEach(() => {
      delete process.env['DISCOVERY_ENDPOINT_APP'];
    });

    it('should get oauthServerUrl and oauthTokenUrl form DISCOVERY_ENDPOINT', async () => {
      const httpServiceMockGet = jest.spyOn(httpServiceMock, 'get');
      httpServiceMockGet.mockReturnValue(
        of({
          data: {
            authorization_endpoint: 'example.com/authorization_endpoint',
            token_endpoint: 'example.com/token_endpoint',
          },
          status: 200,
          statusText: null,
          headers: null,
          config: null,
        })
      );

      process.env['DISCOVERY_ENDPOINT_APP'] = 'example.com';
      const oidc = await service.getOIDC('APP');

      expect(oidc.authorization_endpoint).toEqual(
        'example.com/authorization_endpoint'
      );
      expect(oidc.token_endpoint).toEqual('example.com/token_endpoint');
    });

    it('should not get oauthServerUrl and oauthTokenUrl and throw error when httpService returns error', async () => {
      const httpServiceMockGet = jest.spyOn(httpServiceMock, 'get');
      httpServiceMockGet.mockImplementation(() => {
        return throwError(() => new AxiosError('error'));
      });

      process.env['DISCOVERY_ENDPOINT_APP'] = 'example.com';

      await expect(service.getOIDC('APP')).rejects.toThrow(
        'Error response from discovery service: AxiosError: error'
      );
    });

    it('should get null when DISCOVERY_ENDPOINT endpoint returns with 101 status', async () => {
      const httpServiceMockGet = jest.spyOn(httpServiceMock, 'get');
      httpServiceMockGet.mockReturnValue(
        of({
          data: {
            authorization_endpoint: 'example.com/authorization_endpoint',
            token_endpoint: 'example.com/token_endpoint',
          },
          status: 101,
          statusText: null,
          headers: null,
          config: null,
        })
      );

      process.env['DISCOVERY_ENDPOINT_APP'] = 'example.com';

      await expect(service.getOIDC('APP')).rejects.toThrow(
        'Invalid response from discovery service: Response status: 101, OIDC endpoint: example.com'
      );
    });

    it('should get null when DISCOVERY_ENDPOINT does not exist', async () => {
      const oidc = await service.getOIDC('APP');

      expect(oidc).toBeNull();
    });

    it('should not get oauthTokenUrl form DISCOVERY_ENDPOINT and return null', async () => {
      const httpServiceMockGet = jest.spyOn(httpServiceMock, 'get');
      httpServiceMockGet.mockReturnValue(
        of({
          data: {
            token_endpoint: 'example.com/token_endpoint',
          },
          status: 200,
          statusText: null,
          headers: null,
          config: null,
        })
      );

      process.env['DISCOVERY_ENDPOINT_APP'] = 'example.com';

      await expect(service.getOIDC('APP')).rejects.toThrow(
        'Invalid response from discovery service: Response status: 200, OIDC endpoint: example.com'
      );
    });

    it('should not get oauthServerUrl form DISCOVERY_ENDPOINT and return null', async () => {
      const httpServiceMockGet = jest.spyOn(httpServiceMock, 'get');
      httpServiceMockGet.mockReturnValue(
        of({
          data: {
            authorization_endpoint: 'example.com/authorization_endpoint',
            token_endpoint: null,
          },
          status: 200,
          statusText: null,
          headers: null,
          config: null,
        })
      );

      process.env['DISCOVERY_ENDPOINT_APP'] = 'example.com';

      await expect(service.getOIDC('APP')).rejects.toThrow(
        'Invalid response from discovery service: Response status: 200, OIDC endpoint: example.com'
      );
    });
  });
});
