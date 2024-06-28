import { Test, TestingModule } from '@nestjs/testing';
import { CookiesService } from '../services/cookies.service';
import { AuthDataService } from './auth-data.service';
import { PortalModule } from '../portal.module';
import { mock, MockProxy } from 'jest-mock-extended';
import { AuthTokenService } from './auth-token.service';
import { Request, Response } from 'express';

describe('AuthDataService', () => {
  let service: AuthDataService;
  let iasServiceMock: MockProxy<AuthTokenService>;
  let cookiesService: MockProxy<CookiesService>;

  beforeEach(async () => {
    iasServiceMock = mock<AuthTokenService>();
    cookiesService = mock<CookiesService>();
    const module: TestingModule = await Test.createTestingModule({
      imports: [PortalModule.create({})],
    })
      .overrideProvider(AuthTokenService)
      .useValue(iasServiceMock)
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

    expect(iasServiceMock.exchangeTokenForRefreshToken).not.toHaveBeenCalled();
  });

  it('call the ias service if there is a cookie', async () => {
    // arrange
    // iasServiceMock.getAuthCookie.mockReturnValue('foo');
    const request = mock<Request>();
    const response = mock<Response>();
    cookiesService.getAuthCookie.mockReturnValue('foo');

    // act
    await service.provideAuthData(request, response);

    // assert
    expect(iasServiceMock.exchangeTokenForRefreshToken).toHaveBeenCalledWith(
      request,
      response,
      'foo'
    );
  });
});
