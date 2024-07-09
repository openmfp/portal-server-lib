import { LuigiNode, LuigiUserSettingsConfig } from './luigi.node';

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
