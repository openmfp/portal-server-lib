import { NoopLogoutService } from './noop-logout.service';
import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';
import { mock } from 'jest-mock-extended';

describe('NoopLogoutService', () => {
  let service: NoopLogoutService;
  let requestMock: Request;
  let responseMock: Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NoopLogoutService],
    }).compile();

    service = module.get<NoopLogoutService>(NoopLogoutService);
    requestMock = mock<Request>();
    responseMock = mock<Response>();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should execute handleLogout', async () => {
    // Act
    const result = await service.handleLogout(requestMock, responseMock);

    // Assert
    expect(result).toBeUndefined();
  });
});
