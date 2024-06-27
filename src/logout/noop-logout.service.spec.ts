import { Test, TestingModule } from '@nestjs/testing';
import { NoopLogoutService } from './noop-logout.service';
import { mock } from 'jest-mock-extended';
import { Response } from 'express';

describe('NoopLogoutService', () => {
  let service: NoopLogoutService;
  let responseMock: Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NoopLogoutService],
    }).compile();

    service = module.get<NoopLogoutService>(NoopLogoutService);
    responseMock = mock<Response>();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
