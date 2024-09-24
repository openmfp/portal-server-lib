import { Test, TestingModule } from '@nestjs/testing';
import { ContentConfigurationLuigiDataService } from './content-configuration-luigi-data.service';
import { IntentResolveService } from './intent-resolve.service';
import { RawServiceProvider } from '../../context/service-provider';
import { ExtendedData } from '../../model/content-configuration';

describe('ContentConfigurationLuigiDataService', () => {
  let service: ContentConfigurationLuigiDataService;
  let intentResolveService: jest.Mocked<IntentResolveService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentConfigurationLuigiDataService,
        {
          provide: IntentResolveService,
          useValue: {
            resolve: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ContentConfigurationLuigiDataService>(
      ContentConfigurationLuigiDataService
    );
    intentResolveService = module.get(
      IntentResolveService
    ) as jest.Mocked<IntentResolveService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getLuigiData', () => {
    it('should return Luigi nodes based on content configuration', async () => {
      const mockProvider: RawServiceProvider = {
        contentConfiguration: [
          {
            luigiConfigFragment: {
              data: {
                nodes: [
                  {
                    pathSegment: 'home',
                    label: 'Home',
                    children: [
                      {
                        pathSegment: 'welcome',
                        label: 'Welcome',
                        viewUrl: '/welcome',
                      },
                    ],
                  },
                ],
              },
            },
          },
        ],
      } as any as RawServiceProvider;

      const result = await service.getLuigiData(mockProvider, 'en');

      expect(result).toHaveLength(1);
      expect(result[0].pathSegment).toBe('home');
      expect(result[0].label).toBe('Home');
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].pathSegment).toBe('welcome');
    });

    it('should handle text translations', async () => {
      const mockProvider: RawServiceProvider = {
        contentConfiguration: [
          {
            luigiConfigFragment: {
              data: {
                texts: [
                  { locale: 'en', textDictionary: { welcome: 'Welcome' } },
                  { locale: 'de', textDictionary: { welcome: 'Willkommen' } },
                ],
                nodes: [
                  {
                    pathSegment: 'home',
                    label: '{{welcome}}',
                  },
                ],
              },
            },
          },
        ],
      } as any as RawServiceProvider;

      const resultEn = await service.getLuigiData(mockProvider, 'en');
      expect(resultEn[0].label).toBe('Welcome');

      const resultDe = await service.getLuigiData(mockProvider, 'de');
      expect(resultDe[0].label).toBe('Willkommen');
    });

    it('should add extended data to nodes', async () => {
      const mockProvider: RawServiceProvider = {
        contentConfiguration: [
          {
            luigiConfigFragment: {
              data: {
                nodes: [
                  {
                    pathSegment: 'home',
                    label: 'Home',
                  },
                ],
              },
            },
          },
        ],
      } as any as RawServiceProvider;

      const extendedData: ExtendedData = {
        isMissingMandatoryData: true,
        helpContext: { displayName: 'some-help-context' },
        breadcrumbBadge: { text: 'New', hint: 'positive' },
        extensionClassName: 'MyExtensionClass',
      };

      const result = await service.getLuigiData(
        mockProvider,
        'en',
        extendedData
      );

      expect(result[0].isMissingMandatoryData).toBe(true);
      expect(result[0].helpContext).toEqual({
        displayName: 'some-help-context',
      });
      expect(result[0].breadcrumbBadge).toEqual({
        text: 'New',
        hint: 'positive',
      });
      expect(result[0].context?.extensionClassName).toBe('MyExtensionClass');
    });

    it('should handle empty content configuration', async () => {
      const mockProvider: RawServiceProvider = {
        contentConfiguration: [],
      } as any as RawServiceProvider;

      const result = await service.getLuigiData(mockProvider, 'en');

      expect(result).toEqual([]);
    });

    it('should handle missing nodes in configuration', async () => {
      const mockProvider: RawServiceProvider = {
        contentConfiguration: [
          {
            luigiConfigFragment: {
              data: {},
            },
          },
        ],
      } as any as RawServiceProvider;

      const result = await service.getLuigiData(mockProvider, 'en');

      expect(result).toEqual([]);
    });

    it('should process multiple content configurations', async () => {
      const mockProvider: RawServiceProvider = {
        contentConfiguration: [
          {
            luigiConfigFragment: {
              data: {
                nodeDefaults: { entityType: 'project' },
                nodes: [{ pathSegment: 'home', label: 'Home' }],
              },
            },
          },
          {
            luigiConfigFragment: {
              data: {
                nodeDefaults: { entityType: 'catalog' },
                nodes: [{ pathSegment: 'about', label: 'About' }],
              },
            },
          },
        ],
      } as any as RawServiceProvider;

      const result = await service.getLuigiData(mockProvider, 'en');

      expect(result).toHaveLength(2);
      expect(result[0].pathSegment).toBe('home');
      expect(result[0].entityType).toBe('project');
      expect(result[1].pathSegment).toBe('about');
      expect(result[1].entityType).toBe('catalog');
    });

    it('should handle URL processing correctly', async () => {
      const mockProvider: RawServiceProvider = {
        contentConfiguration: [
          {
            luigiConfigFragment: {
              data: {
                nodes: [
                  {
                    pathSegment: 'home',
                    label: 'Home',
                    url: 'https://example.com/home',
                    viewGroup: 'main',
                  },
                  {
                    pathSegment: 'about',
                    label: 'About',
                    urlSuffix: '/about',
                  },
                ],
              },
            },
          },
        ],
      } as any as RawServiceProvider;

      const result = await service.getLuigiData(
        mockProvider,
        'en',
        undefined,
        'https://app.example.com'
      );

      expect(result[0].viewGroup).toContain(
        'https://app.example.com#https://example.com#main'
      );
      expect(result[0].viewUrl).toBe('https://example.com/home');
      expect(result[1].viewUrl).toBe('https://app.example.com/about');
    });

    it('should process compound children URLs', async () => {
      const mockProvider: RawServiceProvider = {
        contentConfiguration: [
          {
            luigiConfigFragment: {
              data: {
                nodes: [
                  {
                    pathSegment: 'home',
                    label: 'Home',
                    compound: {
                      children: [
                        { label: 'Child1', urlSuffix: '/child1' },
                        { label: 'Child2', url: 'https://example.com/child2' },
                      ],
                    },
                  },
                ],
              },
            },
          },
        ],
      } as any as RawServiceProvider;

      const result = await service.getLuigiData(
        mockProvider,
        'en',
        undefined,
        'https://app.example.com'
      );

      expect(result[0].compound.children[0].viewUrl).toBe(
        'https://app.example.com/child1'
      );
      expect(result[0].compound.children[1].viewUrl).toBe(
        'https://example.com/child2'
      );
    });

    it('should handle node defaults', async () => {
      const mockProvider: RawServiceProvider = {
        contentConfiguration: [
          {
            luigiConfigFragment: {
              data: {
                nodeDefaults: {
                  entityType: 'project',
                },
                nodes: [{ pathSegment: 'home', label: 'Home' }],
              },
            },
          },
        ],
      } as any as RawServiceProvider;

      const result = await service.getLuigiData(mockProvider, 'en');

      expect(result[0].entityType).toEqual('project');
    });

    it('should add user settings configuration', async () => {
      const mockProvider: RawServiceProvider = {
        contentConfiguration: [
          {
            luigiConfigFragment: {
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
            },
          },
        ],
      } as any as RawServiceProvider;

      const result = await service.getLuigiData(
        mockProvider,
        'en',
        undefined,
        'https://app.example.com'
      );

      expect(result[0]._userSettingsConfig).toBeDefined();
      expect(result[0]._userSettingsConfig.groups.general.viewUrl).toBe(
        'https://app.example.com/settings'
      );
    });

    it('should handle missing translations gracefully', async () => {
      const mockProvider: RawServiceProvider = {
        contentConfiguration: [
          {
            luigiConfigFragment: {
              data: {
                texts: [
                  { locale: '', textDictionary: { welcome: 'Welcome' } }, // default
                  { locale: 'de', textDictionary: { welcome: 'Willkommen' } },
                ],
                nodes: [{ pathSegment: 'home', label: '{{welcome}}' }],
              },
            },
          },
        ],
      } as any as RawServiceProvider;

      const result = await service.getLuigiData(mockProvider, 'fr'); // French not available

      expect(result[0].label).toBe('Welcome'); // Should fall back to default
    });
  });
});
