import { HelpContext, LuigiNode } from './luigi.node';
import { BreadcrumbBadge } from './breadcrumb-badge';
import { LuigiUserSettings } from './luigi-user-settings';

export interface LuigiNodeDefaults {
  entityType?: string;
  isolateView?: boolean;
}

export interface Dictionary {
  locale?: string;
  textDictionary: Record<string, string>;
}

export interface LuigiAppConfig {
  _version?: string;
  navMode?: string;
  urlTemplateId?: string;
  urlTemplateParams?: {
    url?: any;
    query: any;
  };
  crossNavigation?: any;
}

export interface ViewGroup {
  preloadSuffix?: string;
  requiredIFramePermissions?: Record<string, string>;
}

export interface LuigiConfigData {
  viewGroup?: ViewGroup;
  nodeDefaults?: LuigiNodeDefaults;
  nodes: LuigiNode[];
  texts?: Dictionary[];
  targetAppConfig?: LuigiAppConfig;
  userSettings?: LuigiUserSettings;
}

export interface LuigiConfigFragment {
  data: LuigiConfigData;
}

export interface ContentConfiguration {
  name: string;
  creationTimestamp: string;
  url?: string;
  luigiConfigFragment: LuigiConfigFragment;
}
