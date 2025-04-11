import { AuthTokenData } from './auth-token.service.js';
import { NoopAuthCallback } from './auth.callback.js';
import type { Request, Response } from 'express';

describe('NoopAuthCallback', () => {
  let callback: NoopAuthCallback;

  beforeEach(() => {
    callback = new NoopAuthCallback();
  });

  describe('handleSuccess', () => {
    it('should resolve the promise', async () => {
      const request = {} as Request;
      const response = {} as Response;
      const authTokenResponse = {} as AuthTokenData;

      await expect(
        callback.handleSuccess(request, response, authTokenResponse),
      ).resolves.toBeUndefined();
    });
  });

  describe('handleFailure', () => {
    it('should resolve the promise', async () => {
      const request = {} as Request;
      const response = {} as Response;

      await expect(
        callback.handleFailure(request, response),
      ).resolves.toBeUndefined();
    });
  });
});
