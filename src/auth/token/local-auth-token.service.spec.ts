import { LocalAuthTokenService } from './local-auth-token.service.js';
import { TokenGenerator } from './token-generator.js';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

describe('LocalAuthTokenService', () => {
  let service: LocalAuthTokenService;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let tokenGenerator: jest.Mocked<TokenGenerator>;

  const request: any = {};
  const response: any = {};

  beforeEach(async () => {
    jwtService = { verify: jest.fn() } as any;
    configService = { get: jest.fn() } as any;
    tokenGenerator = { generateTokens: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalAuthTokenService,
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: TokenGenerator, useValue: tokenGenerator },
      ],
    }).compile();

    service = module.get(LocalAuthTokenService);
  });

  it('throws for refresh-token when JWT is invalid', async () => {
    configService.get.mockReturnValue('secret');
    jwtService.verify.mockImplementation(() => {
      throw new Error('bad token');
    });

    try {
      await service.exchangeTokenForRefreshToken(request, response, 'invalid');
      fail('Expected error not thrown');
    } catch (err: any) {
      expect(err.message).toContain('Invalid or expired refresh token');
      expect(err.message).toContain('bad token');
    }
  });

  it('throws UnauthorizedException when refresh token is expired', async () => {
    configService.get.mockReturnValue('secret');

    jwtService.verify.mockReturnValue({
      user_id: '1',
      email: 'a@b.com',
      first_name: 'A',
      last_name: 'B',
      icon: 'x',
      rt_exp: Date.now() - 10,
    });

    try {
      await service.exchangeTokenForRefreshToken(request, response, 'refresh');
      fail('Expected error not thrown');
    } catch (err: any) {
      expect(err.message).toContain('Refresh period expired — login required.');
    }
  });

  it('generates new tokens when refresh token is valid', async () => {
    configService.get.mockReturnValue('secret');

    jwtService.verify.mockReturnValue({
      user_id: '1',
      email: 'a@b.com',
      first_name: 'A',
      last_name: 'B',
      icon: 'x',
      rt_exp: Date.now() + 10000,
    });

    tokenGenerator.generateTokens.mockResolvedValue({ token: 'new' } as any);

    const result = await service.exchangeTokenForRefreshToken(
      request,
      response,
      'refresh',
    );

    expect(tokenGenerator.generateTokens).toHaveBeenCalled();
    expect(result).toEqual({ token: 'new' });
  });
});
