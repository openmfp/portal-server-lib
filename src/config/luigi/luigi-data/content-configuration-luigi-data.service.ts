import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { RawServiceProvider } from '../../context/service-provider';
import { ExtendedData } from '../../model/content-configuration';
import { LuigiNode } from '../../model/luigi.node';
import { LuigiDataService } from './luigi-data.service';

@Injectable()
export class ContentConfigurationLuigiDataService implements LuigiDataService {
  constructor(private httpService: HttpService) {}

  async getLuigiData(
    provider: RawServiceProvider,
    language: string,
    extendedData?: ExtendedData
  ): Promise<LuigiNode[]> {
    return Promise.resolve([]);
  }
}
