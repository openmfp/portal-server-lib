import { AUTH_CALLBACK_INJECTION_TOKEN } from '../../../injection-tokens.js';
import { CookiesService } from '../../../services/index.js';
import { TokenGenerator } from '../../token/index.js';
import { GoogleAuthController } from './google-auth.controller.js';
import { Test, TestingModule } from '@nestjs/testing';

describe('GoogleAuthController', () => {
  let controller: GoogleAuthController;
  let cookiesService: CookiesService;
  let tokenGenerator: jest.Mocked<TokenGenerator>;
  let authCallbackService: any;

  beforeEach(async () => {
    authCallbackService = { handleSuccess: jest.fn() };
    cookiesService = { setAuthCookie: jest.fn() } as any;
    tokenGenerator = { generateTokens: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoogleAuthController],
      providers: [
        {
          provide: AUTH_CALLBACK_INJECTION_TOKEN,
          useValue: authCallbackService,
        },
        { provide: CookiesService, useValue: cookiesService },
        { provide: TokenGenerator, useValue: tokenGenerator },
      ],
    }).compile();

    controller = module.get(GoogleAuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should handle /redirect flow', async () => {
    const request: any = { user: { id: '123' } };
    const response: any = { redirect: jest.fn() };

    const tokens = {
      access_token: 'a',
      refresh_token: 'b',
      expires_in: 100,
    };

    tokenGenerator.generateTokens.mockResolvedValue(tokens);

    await controller.googleAuthRedirect(request, response);

    expect(tokenGenerator.generateTokens).toHaveBeenCalledWith(request.user);
    expect(cookiesService.setAuthCookie).toHaveBeenCalledWith(
      request,
      response,
      {
        access_token: 'a',
        expires_in: 100,
        refresh_token: 'b',
      },
    );
    expect(authCallbackService.handleSuccess).toHaveBeenCalledWith(
      request,
      response,
      {
        access_token: 'a',
        expires_in: 100,
        refresh_token: 'b',
      },
    );
    expect(response.redirect).toHaveBeenCalledWith('/');
  });
});
