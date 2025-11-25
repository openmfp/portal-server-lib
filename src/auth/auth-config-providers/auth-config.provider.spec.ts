import { EmptyAuthConfigService } from './auth-config.provider.js';
import type { Request } from 'express';
import { mock } from 'jest-mock-extended';

describe('EmptyAuthConfigService', () => {
  let service: EmptyAuthConfigService;

  beforeEach(() => {
    service = new EmptyAuthConfigService();
  });

  describe('getAuthConfig', () => {
    it('should return empty object', async () => {
      const request = mock<Request>();
      request.hostname = 'example.com';

      const result = await service.getAuthConfig(request);

      expect(result).toEqual({});
    });

    it('should return empty object for any hostname', async () => {
      const request = mock<Request>();
      request.hostname = 'test.localhost';

      const result = await service.getAuthConfig(request);

      expect(result).toEqual({});
    });
  });
});
