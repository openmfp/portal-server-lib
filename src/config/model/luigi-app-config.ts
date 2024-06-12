import { LuigiNode, LuigiUserSettingsConfig } from './luigi.node';

export interface LuigiAppConfig {
  urlTemplateParams: Record<string, string>;
  navMode?: string;
  urlTemplateId?: string;
}

interface ViewGroup {
  preloadSuffix?: string;
  requiredIFramePermissions?: Record<string, string>;
}

interface VizConfig {
  viewGroup?: ViewGroup;
  nodes?: LuigiNode[];
  userSettings: LuigiUserSettingsConfig;
  nodeDefaults: any;
}

export interface LuigiNavConfig {
  vizType?: string;
  vizConfig?: VizConfig;
}
