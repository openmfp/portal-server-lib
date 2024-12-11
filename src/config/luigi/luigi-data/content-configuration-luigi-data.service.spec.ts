import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTransferNodeService } from './config-transfer-node.service';
import { ContentConfigurationLuigiDataService } from './content-configuration-luigi-data.service';
import { IntentResolveService } from './intent-resolve.service';
import { RawServiceProvider } from '../../context/service-provider';
import { ExtendedData } from '../../model/content-configuration';
import { NodeExtendedDataService } from './node-extended-data.service';
import { TextsTranslateService } from './texts-translate.service';

describe('ContentConfigurationLuigiDataService', () => {
  let service: ContentConfigurationLuigiDataService;
  let configTransferNodeService: ConfigTransferNodeService;
  let textsTranslateService: jest.Mocked<TextsTranslateService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentConfigurationLuigiDataService,
        ConfigTransferNodeService,
        NodeExtendedDataService,
        TextsTranslateService,
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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('text translations', () => {
    it('should translate the placeholder and have it in the returned nodes', async () => {
      const config: RawServiceProvider = {
        contentConfiguration: [
          {
            name: 'dummy',
            luigiConfigFragment: {
              data: {
                nodes: [
                  {
                    pathSegment: 'overview',
                    label: '{{catalog}}',
                    entityType: 'main',
                  },
                ],
                texts: [
                  {
                    locale: 'en',
                    textDictionary: {
                      catalog: 'Overview',
                    },
                  },
                ],
              },
            },
          },
        ],
      } as any;

      const result = await service.getLuigiData(config, 'en');

      expect(result[0].label).toBe('Overview');
    });
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

    describe('resolve node viewUrl', () => {
      it('should handle URL processing correctly', async () => {
        const mockProvider: RawServiceProvider = {
          contentConfiguration: [
            {
              devUrl: 'https://app.example.com',
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

        const result = await service.getLuigiData(mockProvider, 'en');

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
              devUrl: 'https://app.example.com',
              luigiConfigFragment: {
                data: {
                  nodes: [
                    {
                      pathSegment: 'home',
                      label: 'Home',
                      compound: {
                        children: [
                          { label: 'Child1', urlSuffix: '/child1' },
                          {
                            label: 'Child2',
                            url: 'https://example.com/child2',
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            },
          ],
        } as any as RawServiceProvider;

        const result = await service.getLuigiData(mockProvider, 'en');

        expect(result[0].compound.children[0].viewUrl).toBe(
          'https://app.example.com/child1'
        );
        expect(result[0].compound.children[1].viewUrl).toBe(
          'https://example.com/child2'
        );
      });
    });

    describe('node defaults', () => {
      it('should handle node defaults', async () => {
        const mockProvider: RawServiceProvider = {
          contentConfiguration: [
            {
              devUrl: 'https://app.example.com',
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
    });
  });
});
