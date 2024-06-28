import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CdmLuigiDataBaseService } from './cdm-luigi-data-base.service';

@Injectable()
export class LuigiDataService extends CdmLuigiDataBaseService {
  constructor(private httpServiceImpl: HttpService) {
    super(httpServiceImpl);
  }
}
