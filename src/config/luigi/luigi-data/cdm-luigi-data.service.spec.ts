import { Test, TestingModule } from '@nestjs/testing';
import { NODES_PROCESSOR_INJECTION_TOKEN } from '../../../injection-tokens';
import { IntentResolveService } from './intent-resolve.service';
import { CdmLuigiDataService } from './cdm-luigi-data.service';
import { HttpModule } from '@nestjs/axios';
import { NodesProcessorServiceImpl } from './nodes-processor.service';

describe('CdmLuigiDataService', () => {
  let service: CdmLuigiDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CdmLuigiDataService,
        IntentResolveService,
        {
          provide: NODES_PROCESSOR_INJECTION_TOKEN,
          useClass: NodesProcessorServiceImpl,
        },
      ],
      imports: [HttpModule],
    }).compile();
    service = module.get<CdmLuigiDataService>(CdmLuigiDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
