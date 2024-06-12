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

  describe('getFeatureToggles', function () {
    [
      {
        featureString: '',
        expectedObject: {},
      },
      {
        featureString: 'a=true',
        expectedObject: {
          a: true,
        },
      },
      {
        featureString: 'b=foo,a=TrUe',
        expectedObject: {
          a: true,
          b: false,
        },
      },
      {
        featureString: 'b = foo, a=TrUe ',
        expectedObject: {
          a: true,
          b: false,
        },
      },
    ].forEach((testCase) => {
      it(`should parse features fo '${testCase.featureString}'`, () => {
        process.env.FEATURE_TOGGLES = testCase.featureString;
        const features = service.getFeatureToggles();
        expect(features).toEqual(testCase.expectedObject);
      });
    });
  });
});
