import { RawServiceProvider } from '../../context/service-provider.js';
import { LuigiNode } from '../../model/luigi.node.js';

export interface LuigiDataService {
  getLuigiData(
    provider: RawServiceProvider | any,
    language: string
  ): Promise<LuigiNode[]>;
}
