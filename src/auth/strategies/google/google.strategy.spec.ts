import { GoogleStrategy } from './google.strategy.js';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { VerifyCallback } from 'passport-google-oauth20';

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    configService = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;
  });

  const buildModule = async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleStrategy,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    strategy = module.get(GoogleStrategy);
  };

  it('should enable strategy when credentials exist', async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'OIDC_CLIENT_ID_GOOGLE') return 'id';
      if (key === 'OIDC_CLIENT_SECRET_GOOGLE') return 'secret';
      if (key === 'JWT_REFRESH_LIFESPAN_IN_SECONDS') return 120;
      return undefined;
    });

    await buildModule();

    const done: VerifyCallback = jest.fn();
    const profile = {
      id: '123',
      name: { givenName: 'John', familyName: 'Doe' },
      emails: [{ value: 'john@example.com' }],
      photos: [{ value: 'p1' }],
    };

    await strategy.validate('a', 'b', profile, done);

    const call = (done as jest.Mock).mock.calls[0];
    expect(call[0]).toBeNull();
    expect(call[1]).toMatchObject({
      user_id: '123',
      email: 'john@example.com',
      first_name: 'John',
      last_name: 'Doe',
      icon: 'p1',
    });
  });

  it('should disable strategy when credentials missing', async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'JWT_REFRESH_LIFESPAN_IN_SECONDS') return 120;
      return null;
    });

    await buildModule();

    const done: VerifyCallback = jest.fn();
    const profile = {} as any;

    await strategy.validate('a', 'b', profile, done);

    const call = (done as jest.Mock).mock.calls[0];
    expect(call[0]).toBeInstanceOf(Error);
    expect(call[1]).toBeNull();
  });
});
