import { RawServiceProvider } from '../../context/service-provider';
import { LuigiNode } from '../../model/luigi.node';

export interface LuigiDataService {
  getLuigiData(
    provider: RawServiceProvider | any,
    language: string
  ): Promise<LuigiNode[]>;
}
