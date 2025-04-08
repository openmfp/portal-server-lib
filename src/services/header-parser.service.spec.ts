import { mock } from 'jest-mock-extended';
import { Test, TestingModule } from '@nestjs/testing';
import { PortalModule } from '../portal.module.js';
import { HeaderParserService } from './header-parser.service.js';
import { Request } from 'express';

describe('HeaderParserService', () => {
  let service: HeaderParserService;
  let requestMock: Request;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PortalModule.create({})],
    }).compile();
    service = module.get<HeaderParserService>(HeaderParserService);

    requestMock = mock<Request>();
  });

  it('should extract the token', () => {
    const token = 'fosdoasd';
    requestMock.headers.authorization = 'Bearer ' + token;
    const tenantId = service.extractBearerToken(requestMock);
    expect(tenantId).toBe(token);
  });

  it('should return undefined when no bearer token', () => {
    requestMock.headers.authorization = '';

    expect(service.extractBearerToken(requestMock)).toBeUndefined();
  });
});
