import { TokenGenerator } from './token-generator.js';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

describe('TokenGenerator', () => {
  let service: TokenGenerator;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    jwtService = {
      signAsync: jest.fn(),
    } as any;

    configService = {
      get: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenGenerator,
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get(TokenGenerator);
  });

  it('generates tokens with correct parameters', async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
      if (key === 'JWT_REFRESH_EXPIRATION_IN_SECONDS') return 300;
      if (key === 'JWT_EXPIRATION_IN_SECONDS') return 120;
      return undefined;
    });

    jwtService.signAsync.mockResolvedValueOnce('access-token');
    jwtService.signAsync.mockResolvedValueOnce('refresh-token');

    const payload = {
      user_id: 1,
      email: 'a@b.com',
      first_name: 'A',
      last_name: 'B',
      icon: 'x',
      rt_exp: 1000,
    };

    const result = await service.generateTokens(payload);

    expect(jwtService.signAsync).toHaveBeenCalledWith(payload);
    expect(jwtService.signAsync).toHaveBeenCalledWith(payload, {
      secret: 'refresh-secret',
      expiresIn: '300s',
    });

    expect(result).toEqual({
      access_token: 'access-token',
      id_token: 'access-token',
      refresh_token: 'refresh-token',
      expires_in: 120,
    });
  });
});
