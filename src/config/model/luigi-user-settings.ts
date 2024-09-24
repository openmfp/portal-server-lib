export interface LuigiUserSettings {
  groups: Record<string, LuigiUserSettingsGroup>;
}

export interface LuigiUserSetting {
  type: string;
  label?: string;
  style?: string;
  options?: string[];
  isEditable?: boolean;
}

export interface LuigiUserSettingsGroup {
  label?: string;
  sublabel?: string;
  title?: string;
  icon?: string;
  viewUrl?: string;
  settings?: Record<string, LuigiUserSetting>;
}
