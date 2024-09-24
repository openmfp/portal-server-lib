import { Test, TestingModule } from '@nestjs/testing';
import { CookiesService } from '../services';
import { AuthDataService } from './auth-data.service';
import { PortalModule } from '../portal.module';
import { mock, MockProxy } from 'jest-mock-extended';
import { AuthTokenService } from './auth-token.service';
import { Request, Response } from 'express';

describe('AuthDataService', () => {
  let service: AuthDataService;
  let authTokenService: MockProxy<AuthTokenService>;
  let cookiesService: MockProxy<CookiesService>;

  beforeEach(async () => {
    authTokenService = mock<AuthTokenService>();
    cookiesService = mock<CookiesService>();
    const module: TestingModule = await Test.createTestingModule({
      imports: [PortalModule.create({})],
    })
      .overrideProvider(AuthTokenService)
      .useValue(authTokenService)
      .overrideProvider(CookiesService)
      .useValue(cookiesService)
      .compile();

    service = module.get<AuthDataService>(AuthDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('not do anything if there is no cookie', async () => {
    await service.provideAuthData(mock<Request>(), mock<Response>());

    expect(
      authTokenService.exchangeTokenForRefreshToken
    ).not.toHaveBeenCalled();
  });

  it('call the auth server service if there is a cookie', async () => {
    // arrange
    // authTokenService.getAuthCookie.mockReturnValue('foo');
    const request = mock<Request>();
    const response = mock<Response>();
    cookiesService.getAuthCookie.mockReturnValue('foo');

    // act
    await service.provideAuthData(request, response);

    // assert
    expect(authTokenService.exchangeTokenForRefreshToken).toHaveBeenCalledWith(
      request,
      response,
      'foo'
    );
  });

  it('should log the error and return undefined if there is an error', async () => {
    // arrange
    const request = mock<Request>();
    const response = mock<Response>();
    cookiesService.getAuthCookie.mockReturnValue('foo');
    authTokenService.exchangeTokenForRefreshToken.mockRejectedValue('error');

    // act
    const result = await service.provideAuthData(request, response);

    // assert
    expect(result).toBeUndefined();
  });
});
