import { Test, TestingModule } from '@nestjs/testing';
import { ContentConfigurationValidatorService, ValidationInput, ValidationResult } from './content-configuration-validator.service';
import { Logger } from '@nestjs/common';
import { ContentConfiguration } from '../../../';
import { AxiosResponse } from 'axios';
import { of } from 'rxjs';
import { mock } from 'jest-mock-extended';
import { HttpService } from '@nestjs/axios';

describe('ContentConfigurationValidatorService', () => {
  let service: ContentConfigurationValidatorService;
  let httpServiceMock: HttpService;

  beforeEach(async () => {
    httpServiceMock = mock<HttpService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HttpService,
        Logger,
        ContentConfigurationValidatorService,
      ],
    })
    .overrideProvider(HttpService)
    .useValue(httpServiceMock)
    .compile();
    
    service = module.get<ContentConfigurationValidatorService>(
      ContentConfigurationValidatorService
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateContentConfiguration', () => {
    it('should execute validateContentConfiguration', async () => {
      //Arrange
      const contentConfigurations: ContentConfiguration[] = [
        {
          name: 'example 1',
          creationTimestamp: '',
          luigiConfigFragment: undefined
        },
        {
          name: 'example 2',
          creationTimestamp: '',
          luigiConfigFragment: undefined
        }
      ];

      const requestResult: AxiosResponse<ValidationResult, any> = {
        status: 200,
        statusText: '',
        data: {
          parsedConfiguration: "{\"name\":\"example\",\"luigiConfigFragment\":{\"data\":{\"nodes\":[],\"texts\":[]}}}",
        },
        headers: {},
        config: undefined,
      };

      jest.spyOn(service, 'validateContentConfigurationRequest')
      .mockReturnValue(of(requestResult));

      const expectedResults: ValidationResult[] = [{
        name: "example 1",
        parsedConfiguration: "{\"name\":\"example\",\"luigiConfigFragment\":{\"data\":{\"nodes\":[],\"texts\":[]}}}",
      },{
        name: "example 2",
        parsedConfiguration: "{\"name\":\"example\",\"luigiConfigFragment\":{\"data\":{\"nodes\":[],\"texts\":[]}}}",
      }];

      //Act
      const result = await service.validateContentConfigurations(contentConfigurations);

      //Assert
      expect(result).toEqual(expectedResults);
    });
  });

   describe('validateContentConfigurationRequest', () => {
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
            const request = service.validateContentConfigurationRequest(validationInput).toPromise();
            //Assert
            await expect(request).resolves.toBe(response);
          });
    });
});
