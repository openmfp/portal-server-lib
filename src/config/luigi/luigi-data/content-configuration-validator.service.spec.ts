import { Test, TestingModule } from '@nestjs/testing';
import { ContentConfigurationValidatorService } from './content-configuration-validator.service';
import { LocalNodesValidatorServiceImpl, ValidationResult } from '../../../local-nodes';
import { Logger } from '@nestjs/common';
import { ContentConfiguration, LOCAL_NODES_VALIDATOR_INJECTION_TOKEN } from '../../../';
import { AxiosResponse } from 'axios';
import { of } from 'rxjs';
import { mock, MockProxy } from 'jest-mock-extended';

describe('ContentConfigurationValidatorService', () => {
  let service: ContentConfigurationValidatorService;
  let localNodesValidatorService: MockProxy<LocalNodesValidatorServiceImpl>;

  beforeEach(async () => {
    localNodesValidatorService = mock<LocalNodesValidatorServiceImpl>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: LOCAL_NODES_VALIDATOR_INJECTION_TOKEN,
          useValue: localNodesValidatorService,
        },
        Logger,
        ContentConfigurationValidatorService,
      ],
    }).compile();
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

      const expectedResult: AxiosResponse<ValidationResult, any> = {
        status: 200,
        statusText: '',
        data: {
          parsedConfiguration: "{\"name\":\"example\",\"luigiConfigFragment\":{\"data\":{\"nodes\":[],\"texts\":[]}}}",
        },
        headers: {},
        config: undefined,
      };

      jest.spyOn(localNodesValidatorService, 'validateContentConfiguration')
      .mockReturnValue(of(expectedResult));

      //Act
      const result = await service.validateContentConfiguration(contentConfigurations);

      //Assert
      expect(result).toEqual([expectedResult, expectedResult]);
    });
  });
});
