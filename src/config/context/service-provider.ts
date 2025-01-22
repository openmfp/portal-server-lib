import { BreadcrumbBadge } from '../model/breadcrumb-badge';
import { ContentConfiguration } from '../model/content-configuration';
import { StackSearch } from '../model/luigi.node';

export interface HelpCenterData {
  stackSearch?: StackSearch;
  issueTracker?: URL;
  feedbackTracker?: URL;
}

export interface RawServiceProvider {
  name: string;
  displayName: string;
  contentConfiguration: ContentConfiguration[];
  config: Record<string, string>;
  creationTimestamp: string;
  isMissingMandatoryData?: boolean;
}

export interface ServiceProviderResponse {
  serviceProviders: RawServiceProvider[];
}

export interface URL {
  url: string;
}

export interface ServiceProviderService {
  getServiceProviders(
    token: string,
    entities: string[],
    context: Record<string, any>
  ): Promise<ServiceProviderResponse>;
}

export class EmptyServiceProviderService implements ServiceProviderService {
  getServiceProviders(): Promise<ServiceProviderResponse> {
    return Promise.resolve({
      serviceProviders: [],
    });
  }
}
