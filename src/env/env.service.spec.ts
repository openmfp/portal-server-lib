import { Test, TestingModule } from '@nestjs/testing';
import { EnvService } from './env.service';
import { mock } from 'jest-mock-extended';
import { PortalModuleOptions } from '../portal.module';

describe('EnvService', () => {
  let service: EnvService;

  beforeEach(async () => {
    const frameModuleOptions = mock<PortalModuleOptions>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [EnvService],
    }).compile();

    service = module.get<EnvService>(EnvService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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

      expect(service.getEnv()[resultName]).toBe(expected);

      process.env[envVarName] = undefined;
    });
  });
});
