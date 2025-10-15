import { DiscoveryService } from './discovery.service.js';
import { EnvService } from './env.service.js';
import { Test, TestingModule } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';

describe('EnvService', () => {
  let service: EnvService;
  let discoveryServiceMock: DiscoveryService;

  beforeEach(async () => {
    discoveryServiceMock = mock<DiscoveryService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [EnvService, DiscoveryService],
    })
      .overrideProvider(DiscoveryService)
      .useValue(discoveryServiceMock)
      .compile();

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
      if (value !== undefined && value !== null) {
        process.env[envVarName] = value;
      }

      expect(service.getEnv()[resultName]).toStrictEqual(expected);

      delete process.env[envVarName];
    });
  });

  it('should get if its a development instance', () => {
    process.env['DEVELOPMENT_INSTANCE'] = 'true';

    expect(service.getEnv().developmentInstance).toBe(true);

    delete process.env['DEVELOPMENT_INSTANCE'];
  });

  it('should get if it is not a local instance', () => {
    process.env['ENVIRONMENT'] = 'prod';

    expect(service.getEnv().isLocal).toBe(false);

    delete process.env['ENVIRONMENT'];
  });

  it('should get if it is a local instance', () => {
    process.env['ENVIRONMENT'] = 'local';

    expect(service.getEnv().isLocal).toBe(true);

    delete process.env['ENVIRONMENT'];
  });

  it('should the idp names', () => {
    process.env['IDP_NAMES'] = 'a,b.c,d';

    expect(service.getEnv().idpNames).toEqual(['a', 'b.c', 'd']);

    delete process.env['IDP_NAMES'];
  });

  it('should the validWebcomponentUrls', () => {
    process.env['VALID_WEBCOMPONENT_URLS'] = 'ab,cd';

    expect(service.getEnv().validWebcomponentUrls).toEqual(['ab', 'cd']);

    delete process.env['VALID_WEBCOMPONENT_URLS'];
  });

  it('should the uiOptions', () => {
    process.env['UI_OPTIONS'] = 'ab,cd';

    expect(service.getEnv().uiOptions).toEqual(['ab', 'cd']);

    delete process.env['UI_OPTIONS'];
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
