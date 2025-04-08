import { Injectable } from '@nestjs/common';
import { LuigiConfigData } from '../../model/content-configuration.js';
import { CrossNavigationInbounds, LuigiNode } from '../../model/luigi.node.js';
import { IntentResolveService } from './intent-resolve.service.js';

@Injectable()
export class ConfigTransferNodeService {
  constructor(private intentResolveService: IntentResolveService) {}

  transferConfig(
    nodes: LuigiNode[],
    luigiConfigData: LuigiConfigData,
    urlTemplateUrl: string
  ): void {
    if (nodes.length > 0) {
      const configTransferNode = nodes[0];

      if (luigiConfigData.viewGroup?.preloadSuffix) {
        configTransferNode._preloadUrl = `${urlTemplateUrl}${luigiConfigData.viewGroup.preloadSuffix}`;
      }
      configTransferNode._requiredIFramePermissionsForViewGroup =
        luigiConfigData.viewGroup?.requiredIFramePermissions;

      configTransferNode._userSettingsConfig = luigiConfigData?.userSettings;
      if (configTransferNode._userSettingsConfig?.groups) {
        Object.keys(configTransferNode._userSettingsConfig.groups).forEach(
          (key) => {
            const group = configTransferNode._userSettingsConfig.groups[key];
            if (group.viewUrl && !this.isAbsoluteUrl(group.viewUrl)) {
              group.viewUrl = `${urlTemplateUrl}${group.viewUrl}`;
            }
          }
        );
      }

      // Resolve intentMapping information and pass through with the config transfer node
      const luigiIntentInboundList: CrossNavigationInbounds =
        luigiConfigData.targetAppConfig?.crossNavigation?.inbounds;
      this.intentResolveService.resolve(nodes, luigiIntentInboundList);
    }
  }

  private isAbsoluteUrl(url: string) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
