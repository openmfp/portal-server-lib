import { Injectable } from '@nestjs/common';
import { RawServiceProvider } from '../../context/service-provider';
import {
  ContentConfiguration,
  ExtendedData,
} from '../../model/content-configuration';
import { LuigiNode } from '../../model/luigi.node';
import { LuigiDataService } from './luigi-data.service';
import { NodesProcessorService } from './nodes-processor.service';

@Injectable()
export class ContentConfigurationLuigiDataService implements LuigiDataService {
  constructor(
    protected httpService: any,
    protected nodeProcessorService: NodesProcessorService
  ) {
    this.httpService = httpService;
    this.nodeProcessorService = nodeProcessorService;
  }

  async getLuigiData(
    provider: RawServiceProvider,
    language: string,
    extendedData?: ExtendedData
  ): Promise<LuigiNode[]> {
    return Promise.resolve([]);
  }
}
