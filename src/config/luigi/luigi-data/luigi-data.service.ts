import { RawServiceProvider } from '../../context/service-provider';
import { ExtendedData } from '../../model/content-configuration';
import { LuigiNode } from '../../model/luigi.node';

export interface LuigiDataService {
  getLuigiData(
    provider: RawServiceProvider | any,
    language: string,
    extendedData?: ExtendedData
  ): Promise<LuigiNode[]>;
}
