import { Test, TestingModule } from '@nestjs/testing';
import { ContentConfigurationValidatorService } from './content-configuration-validator.service';

describe('ContentConfigurationValidatorService', () => {
  let service: ContentConfigurationValidatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
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
