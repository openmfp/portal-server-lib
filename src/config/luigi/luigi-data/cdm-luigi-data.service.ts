import { Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { NODES_PROCESSOR_INJECTION_TOKEN } from '../../../injection-tokens';
import { CdmLuigiDataBaseService } from './cdm-luigi-data-base.service';
import { NodesProcessorService } from './nodes-processor.service';

@Injectable()
export class CdmLuigiDataService extends CdmLuigiDataBaseService {
  constructor(
    private httpServiceImpl: HttpService,
    @Inject(NODES_PROCESSOR_INJECTION_TOKEN)
    private nodeProcessorServiceImpl: NodesProcessorService
  ) {
    super(httpServiceImpl, nodeProcessorServiceImpl);
  }
}
