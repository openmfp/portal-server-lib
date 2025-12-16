import {
  EmptyVariablesService,
  EnvConfigVariables,
} from './env-variables.service.js';
import type { Request, Response } from 'express';

describe('EmptyVariablesService', () => {
  let service: EmptyVariablesService;
  beforeEach(() => {
    service = new EmptyVariablesService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getEnv should return an object that matches EnvConfigVariables (empty)', async () => {
    const req = {} as Request;
    const res = {} as Response;
    const result = await service.getEnv(req, res);
    expect(result).toEqual({} as EnvConfigVariables);
    expect(typeof result).toBe('object');
  });

  it('getEnv resolves to a Promise (async behavior)', () => {
    const req = {} as Request;
    const res = {} as Response;
    const promise = service.getEnv(req, res);
    expect(promise).toBeInstanceOf(Promise);
    return expect(promise).resolves.toEqual({} as EnvConfigVariables);
  });

  it('getEnv does not throw when request/response contain fields', async () => {
    const req = { headers: { host: 'example.local' } } as unknown as Request;
    const res = { status: () => res } as unknown as Response;
    await expect(service.getEnv(req, res)).resolves.toEqual(
      {} as EnvConfigVariables,
    );
  });
});
