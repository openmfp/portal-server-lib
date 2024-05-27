import { Test, TestingModule } from '@nestjs/testing';
import { NoopAuthCallback } from './authCallback';

describe('NoopAuthCallback', () => {
  let service: NoopAuthCallback;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NoopAuthCallback],
    }).compile();

    service = module.get<NoopAuthCallback>(NoopAuthCallback);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('callback should return a resolved promise', async () => {
    await expect(service.callback()).resolves.toBeUndefined();
  });

  it('clearCookies should return a resolved promise', async () => {
    const responseMock = {} as any;
    await expect(service.clearCookies(responseMock)).resolves.toBeUndefined();
  });

  it('setCookies should return a resolved promise', async () => {
    await expect(service.setCookies()).resolves.toBeUndefined();
  });
});
