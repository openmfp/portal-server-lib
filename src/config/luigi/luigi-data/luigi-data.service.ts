import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { LuigiDataBaseService } from './luigi-data-base.service';
import { ContentConfigurationLuigiDataService } from './content-configuration-luigi-data.service';

@Injectable()
export class LuigiDataService extends LuigiDataBaseService {
  constructor(
    private httpServiceImpl: HttpService,
    protected contentConfigurationLuigiDataService: ContentConfigurationLuigiDataService
  ) {
    super(httpServiceImpl, contentConfigurationLuigiDataService);
  }
}
