import { HelpContext, LuigiNode } from './luigi.node';
import { BreadcrumbBadge } from './breadcrumb-badge';

export interface LuigiNodeDefaults {
  entityType?: string;
  isolateView?: boolean;
}

export interface Dictionary {
  locale: string;
  textDictionary: Record<string, string>;
}

export interface LuigiConfigData {
  nodeDefaults?: LuigiNodeDefaults;
  nodes: LuigiNode[];
  texts?: Dictionary[];
}

export interface LuigiConfigFragment {
  data: LuigiConfigData;
}

export interface ExtendedData {
  isMissingMandatoryData?: boolean;
  extensionClassName?: string;
  helpContext?: HelpContext;
  breadcrumbBadge?: BreadcrumbBadge;
}

export interface ContentConfiguration extends ExtendedData {
  name: string;
  creationTimestamp: string;
  luigiConfigFragment: LuigiConfigFragment[];
}

export interface CDM {
  //either data or url has to be set
  url?: string;
  data?: Record<any, any>;
}
