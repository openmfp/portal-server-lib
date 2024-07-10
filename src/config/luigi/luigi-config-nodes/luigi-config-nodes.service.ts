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
    private cdmLuigiData: LuigiDataService
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
    const serviceProviders: ServiceProvider[] = [];
    const rawServiceProviders = fetchedProvider.serviceProviders;
    const promises = rawServiceProviders.map((provider) =>
      this.cdmLuigiData
        .getLuigiData(provider, acceptLanguage, {
          isMissingMandatoryData: provider.isMissingMandatoryData,
          extensionClassName: provider.extensionClassName,
          helpContext: {
            displayName: provider.displayName,
            ...provider.helpCenterData,
            documentation: provider.documentation,
          },
          breadcrumbBadge: provider?.breadcrumbBadge,
        })
        .then(
          (nodes) => ({ nodes, provider }),
          (error) =>
            console.error("[ERROR] Couldn't create nodes", provider, error)
        )
    );

    const luigiDataPromises = await Promise.allSettled(promises);

    for (const luigiData of luigiDataPromises) {
      if (luigiData.status === 'rejected') {
        continue;
      }
      const value = luigiData.value;
      if (value) {
        const rawProvider = value.provider;
        serviceProviders.push({
          config: rawProvider.config,
          installationData: rawProvider.installationData,
          isMandatoryExtension: rawProvider.isMandatoryExtension,
          nodes: value.nodes,
          creationTimestamp: rawProvider.creationTimestamp,
        });
      }
    }
    return serviceProviders;
  }
}
