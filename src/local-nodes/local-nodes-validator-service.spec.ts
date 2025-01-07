/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { LocalNodesValidatorService, ValidationInput } from './local-nodes-validator-service';
import { mock } from 'jest-mock-extended';
import { of } from 'rxjs';
import { AxiosResponse } from 'axios';

describe('LocalNodesValidatorService', () => {
  let service: LocalNodesValidatorService;
  let httpServiceMock: HttpService;

  beforeEach(async () => {
    httpServiceMock = mock<HttpService>();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [LocalNodesValidatorService, HttpService]
    })
    .overrideProvider(HttpService)
    .useValue(httpServiceMock)
    .compile();

    service = module.get<LocalNodesValidatorService>(LocalNodesValidatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateContentConfiguration', () => {
    it('should post request to validate data', async () => {
          //Arrange
          const response = {
            data: {
              parsedConfiguration: '',
            },
            status: 200,
            statusText: null,
            headers: null,
            config: null,
          } as AxiosResponse;

          const httpServiceMockGet = jest.spyOn(httpServiceMock, 'post');
          httpServiceMockGet.mockReturnValue(
            of(response)
          );

          const validationInput: ValidationInput =  {
            contentType: 'JSON',
            contentConfiguration: undefined,
          }

          //Act
          const request = service.validateContentConfiguration(validationInput).toPromise();
          //Assert
          await expect(request).resolves.toBe(response);
        });
  });
});
