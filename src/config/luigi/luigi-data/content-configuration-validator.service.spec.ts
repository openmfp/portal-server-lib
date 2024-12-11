import { Test, TestingModule } from '@nestjs/testing';
import { ContentConfigurationValidatorService } from './content-configuration-validator.service';
import { LOCAL_NODES_VALIDATOR_INJECTION_TOKEN } from '../../../injection-tokens';
import { mock, MockProxy } from 'jest-mock-extended';
import { LocalNodesValidatorProvider } from '../../../local-nodes';
import { Logger } from '@nestjs/common';

describe('ContentConfigurationValidatorService', () => {
  let service: ContentConfigurationValidatorService;
  let localNodesValidatorMock: MockProxy<LocalNodesValidatorProvider>;

  beforeEach(async () => {
    localNodesValidatorMock = mock<LocalNodesValidatorProvider>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: LOCAL_NODES_VALIDATOR_INJECTION_TOKEN,
          useValue: localNodesValidatorMock,
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

});
