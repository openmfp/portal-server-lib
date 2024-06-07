import { Test, TestingModule } from '@nestjs/testing';
import { CdmLuigiDataService } from './cdm-luigi-data.service';
import { HttpModule } from '@nestjs/axios';

describe('CdmLuigiDataService', () => {
  let service: CdmLuigiDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CdmLuigiDataService],
      imports: [HttpModule],
    }).compile();
    service = module.get<CdmLuigiDataService>(CdmLuigiDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
