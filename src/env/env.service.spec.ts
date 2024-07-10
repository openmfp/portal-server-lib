import { Test, TestingModule } from '@nestjs/testing';
import { EnvService } from './env.service';

describe('EnvService', () => {
  let service: EnvService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EnvService],
    }).compile();

    service = module.get<EnvService>(EnvService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get default value from logoutRedirectUrl', () => {
    expect(service.getEnv()['logoutRedirectUrl']).toStrictEqual('/logout');
  });

  it('should get logoutRedirectUrl', () => {
    const envVarName = 'LOGOUT_REDIRECT_URL';
    process.env[envVarName] = '/test';

    expect(service.getEnv()['logoutRedirectUrl']).toStrictEqual('/test');

    delete process.env[envVarName];
  });

  [
    {
      envVarName: 'HEALTH_CHECK_INTERVAL',
      resultName: 'healthCheckInterval',
      value: '123',
      expected: 123,
    },
    {
      envVarName: 'HEALTH_CHECK_INTERVAL',
      resultName: 'healthCheckInterval',
      value: '',
      expected: NaN,
    },
    {
      envVarName: 'HEALTH_CHECK_INTERVAL',
      resultName: 'healthCheckInterval',
      value: 'aaaa',
      expected: NaN,
    },
  ].forEach(function ({ envVarName, resultName, value, expected }) {
    it('should get ' + resultName, () => {
      process.env[envVarName] = value;

      expect(service.getEnv()[resultName]).toStrictEqual(expected);

      delete process.env[envVarName];
    });
  });
});
