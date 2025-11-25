import { AUTH_CONFIG_INJECTION_TOKEN } from '../../injection-tokens.js';
import { AuthConfigProvider } from '../auth-config-providers/index.js';
import { AuthTokenServiceImpl } from './auth-token-orch.service.js';
import { ExtAuthTokenService } from './ext-auth-token.service.js';
import { LocalAuthTokenService } from './local-auth-token.service.js';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

describe('AuthTokenServiceImpl', () => {
  let service: AuthTokenServiceImpl;
  let configService: jest.Mocked<ConfigService>;
  let extService: jest.Mocked<ExtAuthTokenService>;
  let localService: jest.Mocked<LocalAuthTokenService>;
  let authConfigProvider: jest.Mocked<AuthConfigProvider>;

  const request: any = {};
  const response: any = {};

  beforeEach(async () => {
    configService = { get: jest.fn() } as any;
    extService = {
      exchangeTokenForCode: jest.fn(),
      exchangeTokenForRefreshToken: jest.fn(),
    } as any;

    localService = {
      exchangeTokenForCode: jest.fn(),
      exchangeTokenForRefreshToken: jest.fn(),
    } as any;

    authConfigProvider = {
      getAuthConfig: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthTokenServiceImpl,
        { provide: ConfigService, useValue: configService },
        { provide: ExtAuthTokenService, useValue: extService },
        { provide: LocalAuthTokenService, useValue: localService },
        { provide: AUTH_CONFIG_INJECTION_TOKEN, useValue: authConfigProvider },
      ],
    }).compile();

    service = module.get(AuthTokenServiceImpl);
  });

  it('uses local service when oauthTokenUrl is missing (exchangeTokenForCode)', async () => {
    authConfigProvider.getAuthConfig.mockResolvedValue({ oauthTokenUrl: null });

    localService.exchangeTokenForCode.mockResolvedValue({ a: 1 } as any);

    const result = await service.exchangeTokenForCode(request, response, 'abc');

    expect(localService.exchangeTokenForCode).toHaveBeenCalledWith(
      request,
      response,
      'abc',
    );
    expect(result).toEqual({ a: 1 });
  });

  it('uses external service when oauthTokenUrl exists (exchangeTokenForCode)', async () => {
    authConfigProvider.getAuthConfig.mockResolvedValue({
      oauthTokenUrl: 'https://example.com',
    });

    extService.exchangeTokenForCode.mockResolvedValue({ b: 2 } as any);

    const result = await service.exchangeTokenForCode(request, response, 'abc');

    expect(extService.exchangeTokenForCode).toHaveBeenCalledWith(
      request,
      response,
      'abc',
    );
    expect(result).toEqual({ b: 2 });
  });

  it('uses local service when oauthTokenUrl is missing (exchangeTokenForRefreshToken)', async () => {
    authConfigProvider.getAuthConfig.mockResolvedValue({ oauthTokenUrl: null });

    localService.exchangeTokenForRefreshToken.mockResolvedValue({
      x: 3,
    } as any);

    const result = await service.exchangeTokenForRefreshToken(
      request,
      response,
      'refresh',
    );

    expect(localService.exchangeTokenForRefreshToken).toHaveBeenCalledWith(
      request,
      response,
      'refresh',
    );
    expect(result).toEqual({ x: 3 });
  });

  it('uses external service when oauthTokenUrl exists (exchangeTokenForRefreshToken)', async () => {
    authConfigProvider.getAuthConfig.mockResolvedValue({
      oauthTokenUrl: 'https://example.com',
    });

    extService.exchangeTokenForRefreshToken.mockResolvedValue({ y: 4 } as any);

    const result = await service.exchangeTokenForRefreshToken(
      request,
      response,
      'refresh',
    );

    expect(extService.exchangeTokenForRefreshToken).toHaveBeenCalledWith(
      request,
      response,
      'refresh',
    );
    expect(result).toEqual({ y: 4 });
  });
});
