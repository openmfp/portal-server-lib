import { Test, TestingModule } from '@nestjs/testing';
import { EnvService } from './env.service';
import { mock } from 'jest-mock-extended';
import { Request } from 'express';

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
    {
      envVarName: 'IDP_NAMES',
      resultName: 'idpNames',
      value: 'idp_1,idp_2',
      expected: ['idp_1', 'idp_2'],
    },
  ].forEach(function ({ envVarName, resultName, value, expected }) {
    it('should get ' + resultName, () => {
      process.env[envVarName] = value;

      expect(service.getEnv()[resultName]).toStrictEqual(expected);

      delete process.env[envVarName];
    });
  });

  it('should the idp names', () => {
    process.env['IDP_NAMES'] = 'a,b.c,d';

    expect(service.getEnv().idpNames).toEqual(['a', 'b.c', 'd']);

    delete process.env['IDP_NAMES'];
  });

  describe('getEnvWithAuth', () => {
    const oauthServerUrlSAP = 'www.sap.com';
    const oauthServerUrlFoo = 'www.foo.com';
    const oauthServerUrlHyperspace = 'www.btp.com';
    const clientIdFoo = '12134aads';
    const clientIdHyperspace = 'bbbtttppp';
    const clientIdSap = 'asqrfr';
    const clientSecretHyperspace = 'topSecret';
    const clientSecretFoo = 'topSecretFoo';
    const clientSecretSap = 'topSecretSap';

    beforeEach(() => {
      process.env['IDP_NAMES'] = 'sap,foo,hyperspace,not-configured';
      process.env['BASE_DOMAINS_SAP'] = 'dxp.k8s.ondemand.com';
      process.env['IAS_TENANT_URL_SAP'] = oauthServerUrlSAP;
      process.env['OIDC_CLIENT_ID_SAP'] = clientIdSap;
      process.env['OIDC_CLIENT_SECRET_SAP'] = clientSecretSap;
      process.env['BASE_DOMAINS_HYPERSPACE'] = 'hyper.space,localhost';
      process.env['BASE_DOMAINS_FOO'] = '';
      process.env['IAS_TENANT_URL_FOO'] = oauthServerUrlFoo;
      process.env['OIDC_CLIENT_ID_FOO'] = clientIdFoo;
      process.env['OIDC_CLIENT_SECRET_FOO'] = clientSecretFoo;
      process.env['IAS_TENANT_URL_HYPERSPACE'] = oauthServerUrlHyperspace;
      process.env['OIDC_CLIENT_ID_HYPERSPACE'] = clientIdHyperspace;
      process.env['OIDC_CLIENT_SECRET_HYPERSPACE'] = clientSecretHyperspace;
    });

    it('should map the idp to the url for foo', () => {
      const request = mock<Request>();
      request.hostname = 'foo.hyper.space';

      const envWithAuth = service.getCurrentAuthEnv(request);

      expect(envWithAuth.clientId).toBe(clientIdFoo);
      expect(envWithAuth.oauthServerUrl).toBe(oauthServerUrlFoo);
      expect(envWithAuth.oauthServerUrl).toBe(oauthServerUrlFoo);
    });

    it('should map the idp of foo to a different base url', () => {
      const request = mock<Request>();
      request.hostname = 'foo.dxp.k8s.ondemand.com';

      const envWithAuth = service.getCurrentAuthEnv(request);

      expect(envWithAuth.clientId).toBe(clientIdFoo);
      expect(envWithAuth.oauthServerUrl).toBe(oauthServerUrlFoo);
      expect(envWithAuth.clientSecret).toBe(clientSecretFoo);
    });

    it('should return the default tenant, if a host name is directly matched', () => {
      const request = mock<Request>();
      request.hostname = 'dxp.k8s.ondemand.com';

      const envWithAuth = service.getCurrentAuthEnv(request);

      expect(envWithAuth.clientId).toBe(clientIdSap);
      expect(envWithAuth.oauthServerUrl).toBe(oauthServerUrlSAP);
      expect(envWithAuth.clientSecret).toBe(clientSecretSap);
    });

    it('should return the default tenant, for a different host with multiple names is directly matched', () => {
      const request = mock<Request>();
      request.hostname = 'hyper.space';

      const envWithAuth = service.getCurrentAuthEnv(request);

      expect(envWithAuth.clientId).toBe(clientIdHyperspace);
      expect(envWithAuth.oauthServerUrl).toBe(oauthServerUrlHyperspace);
      expect(envWithAuth.clientSecret).toBe(clientSecretHyperspace);
    });

    it('should throw when the idp is not existing', () => {
      const request = mock<Request>();
      request.hostname = 'not-existing.dxp.k8s.ondemand.com';

      expect(function () {
        service.getCurrentAuthEnv(request);
      }).toThrow("the idp 'not-existing' is not configured!");
    });

    it('should throw when the domain is not existing', () => {
      const request = mock<Request>();
      request.hostname = 'sap-btp.foo.com';

      expect(function () {
        service.getCurrentAuthEnv(request);
      }).toThrow(
        "sap-btp.foo.com is not listed in the portal's base urls: 'dxp.k8s.ondemand.com,hyper.space,localhost'"
      );
    });

    it('should throw when the idp is not properly configured', () => {
      const request = mock<Request>();
      request.hostname = 'not-configured.dxp.k8s.ondemand.com';

      expect(function () {
        service.getCurrentAuthEnv(request);
      }).toThrow(
        "the idp not-configured is not properly configured. oauthServerUrl: 'undefined' clientId: 'undefined', has client secret (OIDC_CLIENT_SECRET_NOT_CONFIGURED): false"
      );
    });
  });
});
