import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CdmLuigiDataServiceBase } from './cdm-luigi-data-service-base';

@Injectable()
export class CdmLuigiDataService extends CdmLuigiDataServiceBase {
  constructor(private httpServiceImpl: HttpService) {
    super(httpServiceImpl);
  }
}
