import { Test, TestingModule } from '@nestjs/testing';
import { EmptyEnvVariablesService } from './env-variables.service';

describe('EmptyEnvVariablesService', () => {
  let service: EmptyEnvVariablesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmptyEnvVariablesService],
    }).compile();

    service = module.get<EmptyEnvVariablesService>(EmptyEnvVariablesService);
  });

  it('should return an empty object', async () => {
    const mockRequest = {};
    const mockResponse = {};

    const response = await service.getEnv(mockRequest, mockResponse);

    expect(response).toEqual({});
  });
});
