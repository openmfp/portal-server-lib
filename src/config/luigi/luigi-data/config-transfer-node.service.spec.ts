import { RawServiceProvider } from '../../context/service-provider';
import { LuigiConfigFragment } from '../../model/content-configuration';
import { ConfigTransferNodeService } from './config-transfer-node.service';
import { IntentResolveService } from './intent-resolve.service';

describe('ConfigTransferNodeService', () => {
  let service: ConfigTransferNodeService;
  let intentResolveService: IntentResolveService;

  beforeEach(() => {
    intentResolveService = {
      resolve: jest.fn(),
    } as any as IntentResolveService;
    service = new ConfigTransferNodeService(intentResolveService);
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
  });
});
