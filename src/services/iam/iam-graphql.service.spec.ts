import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLClient } from 'graphql-request';
import { mock } from 'jest-mock-extended';
import { IAMGraphQlService } from './iam-graphql.service.js';
import { MUTATION_LOGIN } from './queries.js';

describe('IAMGraphQlService', () => {
  const iamServiceApiUrl = 'http://localhost:8080/query';
  let service: IAMGraphQlService;
  const gqlClient = mock<GraphQLClient>({
    request: jest.fn().mockResolvedValue(''),
    setHeaders: jest.fn().mockResolvedValue(''),
    rawRequest: jest.fn().mockResolvedValue(''),
  });

  beforeEach(async () => {

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          useValue: gqlClient,
          provide: GraphQLClient,
        },
        IAMGraphQlService,
      ],
    }).compile();

    service = module.get<IAMGraphQlService>(IAMGraphQlService);
  });

  beforeEach(async () => {
    jest.resetAllMocks();
  });

  it('should call mutation addUser', async () => {
    gqlClient.request.mockResolvedValue('');

    const response = await service.addUser('token');
    expect(gqlClient.setHeader).toHaveBeenCalledWith(
      'authorization',
      'Bearer token',
    );
    expect(gqlClient.request).toHaveBeenCalledWith(MUTATION_LOGIN);
    expect(response).toBe(undefined);
  });

  it('should call mutation addUser and log error', async () => {
    console.error = jest.fn();
    gqlClient.request.mockRejectedValue('error');

    const response = await service.addUser('token');
    expect(response).toBe(undefined);
    expect(console.error).toHaveBeenCalledWith('error');
  });

});
