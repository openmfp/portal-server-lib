import { Inject, Injectable } from '@nestjs/common';
import {
  LUIGI_DATA_SERVICE_INJECTION_TOKEN,
  SERVICE_PROVIDER_INJECTION_TOKEN,
} from '../../../injection-tokens';
import { ServiceProvider } from '../../model/luigi.node';
import {
  ServiceProviderResponse,
  ServiceProviderService,
} from '../../context/service-provider';
import { LuigiDataService } from '../luigi-data/luigi-data.service';

@Injectable()
export class LuigiConfigNodesService {
  constructor(
    @Inject(SERVICE_PROVIDER_INJECTION_TOKEN)
    private serviceProviderService: ServiceProviderService,
    @Inject(LUIGI_DATA_SERVICE_INJECTION_TOKEN)
    private luigiDataService: LuigiDataService
  ) {}

  async getNodes(
    token: string,
    entities: string[],
    acceptLanguage: string,
    context?: Record<string, any>
  ): Promise<ServiceProvider[]> {
    const serviceProviders =
      await this.serviceProviderService.getServiceProviders(
        token,
        entities,
        context
      );
    return this.getNodesFromProvider(serviceProviders, acceptLanguage);
  }

  async getNodesFromProvider(
    fetchedProvider: ServiceProviderResponse,
    acceptLanguage: string
  ): Promise<ServiceProvider[]> {
    const rawServiceProviders = fetchedProvider.serviceProviders;
    const promises = rawServiceProviders.map((provider) =>
      this.luigiDataService
        .getLuigiData(provider, acceptLanguage, {
          ...provider,
        })
        .then(
          (nodes) => ({ nodes, provider }),
          (error) =>
            console.error("[ERROR] Couldn't create nodes", provider, error)
        )
    );

    const luigiDataPromises = await Promise.allSettled(promises);

    const serviceProviders: ServiceProvider[] = [];
    for (const luigiData of luigiDataPromises) {
      if (luigiData.status === 'rejected') {
        continue;
      }
      const value = luigiData.value;
      if (value) {
        const rawProvider = value.provider;
        serviceProviders.push({
          ...rawProvider,
          nodes: value.nodes,
        });
      }
    }
    return serviceProviders;
  }
}
