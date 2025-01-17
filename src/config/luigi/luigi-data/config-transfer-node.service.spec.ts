import { RawServiceProvider } from '../../context/service-provider';
import {
  LuigiConfigData,
  LuigiConfigFragment,
} from '../../model/content-configuration';
import { CrossNavigationInbounds, LuigiNode } from '../../model/luigi.node';
import { ConfigTransferNodeService } from './config-transfer-node.service';
import { IntentResolveService } from './intent-resolve.service';

describe('ConfigTransferNodeService', () => {
  let service: ConfigTransferNodeService;
  let intentResolveServiceMock: IntentResolveService;

  beforeEach(() => {
    intentResolveServiceMock = {
      resolve: jest.fn(),
    } as any as IntentResolveService;
    service = new ConfigTransferNodeService(intentResolveServiceMock);
  });

  describe('isAbsoluteUrl', () => {
    it('should correctly identify absolute URLs', () => {
      const absoluteUrls = [
        'http://example.com',
        'https://example.com',
        'ftp://example.com',
      ];

      absoluteUrls.forEach((url) => {
        expect((service as any).isAbsoluteUrl(url)).toBe(true);
      });
    });

    it('should correctly identify relative URLs', () => {
      const relativeUrls = [
        '/path/to/resource',
        'path/to/resource',
        './resource',
        '../resource',
      ];

      relativeUrls.forEach((url) => {
        expect((service as any).isAbsoluteUrl(url)).toBe(false);
      });
    });
  });

  describe('transferConfig', () => {
    it('should add user settings configuration', () => {
      const luigiConfigFragment: LuigiConfigFragment = {
        data: {
          nodes: [{ pathSegment: 'home', label: 'Home' }],
          userSettings: {
            groups: {
              general: {
                viewUrl: '/settings',
              },
            },
          },
        },
      };

      service.transferConfig(
        luigiConfigFragment.data.nodes,
        luigiConfigFragment.data,
        'https://app.example.com'
      );

      expect(
        luigiConfigFragment.data.nodes[0]._userSettingsConfig
      ).toBeDefined();
      expect(
        luigiConfigFragment.data.nodes[0]._userSettingsConfig.groups.general
          .viewUrl
      ).toBe('https://app.example.com/settings');
    });

    it('should not modify anything if nodes array is empty', () => {
      const nodes: LuigiNode[] = [];
      const luigiConfigData: LuigiConfigData = {} as LuigiConfigData;
      const urlTemplateUrl = 'https://example.com/';

      service.transferConfig(nodes, luigiConfigData, urlTemplateUrl);

      expect(nodes).toEqual([]);
      expect(intentResolveServiceMock.resolve).not.toHaveBeenCalled();
    });

    it('should set _preloadUrl if viewGroup.preloadSuffix exists', () => {
      const nodes: LuigiNode[] = [{}];
      const luigiConfigData: LuigiConfigData = {
        viewGroup: { preloadSuffix: 'preload' },
      } as LuigiConfigData;
      const urlTemplateUrl = 'https://example.com/';

      service.transferConfig(nodes, luigiConfigData, urlTemplateUrl);

      expect(nodes[0]._preloadUrl).toBe('https://example.com/preload');
    });

    it('should set _requiredIFramePermissionsForViewGroup if it exists', () => {
      const nodes: LuigiNode[] = [{}];
      const luigiConfigData: LuigiConfigData = {
        viewGroup: { requiredIFramePermissions: ['camera', 'microphone'] },
      } as any as LuigiConfigData;
      const urlTemplateUrl = 'https://example.com/';

      service.transferConfig(nodes, luigiConfigData, urlTemplateUrl);

      expect(nodes[0]._requiredIFramePermissionsForViewGroup).toEqual([
        'camera',
        'microphone',
      ]);
    });

    it('should set _userSettingsConfig and update relative viewUrls', () => {
      const nodes: LuigiNode[] = [{}];
      const luigiConfigData: LuigiConfigData = {
        userSettings: {
          groups: {
            group1: { viewUrl: 'settings1' },
            group2: { viewUrl: 'https://external.com/settings2' },
          },
        },
      } as any as LuigiConfigData;
      const urlTemplateUrl = 'https://example.com/';

      service.transferConfig(nodes, luigiConfigData, urlTemplateUrl);

      expect(nodes[0]._userSettingsConfig).toEqual({
        groups: {
          group1: { viewUrl: 'https://example.com/settings1' },
          group2: { viewUrl: 'https://external.com/settings2' },
        },
      });
    });

    it('should call intentResolveService.resolve with correct parameters', () => {
      const nodes: LuigiNode[] = [{}];
      const luigiConfigData: LuigiConfigData = {
        targetAppConfig: {
          crossNavigation: {
            inbounds: {} as CrossNavigationInbounds,
          },
        },
      } as any as LuigiConfigData;
      const urlTemplateUrl = 'https://example.com/';

      service.transferConfig(nodes, luigiConfigData, urlTemplateUrl);

      expect(intentResolveServiceMock.resolve).toHaveBeenCalledWith(
        nodes,
        luigiConfigData.targetAppConfig?.crossNavigation?.inbounds
      );
    });
  });
});
