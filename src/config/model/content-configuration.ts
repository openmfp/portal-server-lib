import { HelpContext, LuigiNode } from './luigi.node';
import { BreadcrumbBadge } from './breadcrumb-badge';
import { LuigiUserSettings } from './luigi-user-settings';

export interface LuigiNodeDefaults {
  entityType?: string;
  isolateView?: boolean;
}

export interface Dictionary {
  locale: string;
  textDictionary: Record<string, string>;
}

export interface LuigiAppConfig {
  urlTemplateParams: Record<string, any>;
  navMode?: string;
  urlTemplateId?: string;
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
  targetAppConfig?: Record<string, any>;
  userSettings?: LuigiUserSettings;
}

export interface LuigiConfigFragment {
  data: LuigiConfigData;
}

export interface ExtendedData {
  isMissingMandatoryData?: boolean;
  extensionClassName?: string;
  helpContext?: HelpContext;
  breadcrumbBadge?: BreadcrumbBadge;
  devUrl?: string;
}

export interface ContentConfiguration extends ExtendedData {
  name: string;
  creationTimestamp: string;
  luigiConfigFragment: LuigiConfigFragment;
}
