import { HttpModule, HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import {
  CrossNavigationInbounds,
  LuigiIntent,
  LuigiNode,
} from '../../model/luigi.node';
import { BreadcrumbBadge } from '../../model/breadcrumb-badge';
import { ContentConfigurationLuigiDataService } from './content-configuration-luigi-data.service';
import { mock } from 'jest-mock-extended';
import {
  ContentConfiguration,
  Dictionary,
  LuigiNodeDefaults,
} from '../../model/configuration';
import nock from 'nock';

describe('ContentConfigurationLuigiDataService', () => {
  let service: ContentConfigurationLuigiDataService;
  const language = 'en';
  let ccJson: ContentConfiguration;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContentConfigurationLuigiDataService],
      imports: [HttpModule],
    }).compile();
    service = module.get<ContentConfigurationLuigiDataService>(
      ContentConfigurationLuigiDataService
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  beforeEach(() => {
    ccJson = {
      name: 'CC-1',
      creationTimestamp: '2022-05-17T11:37:17Z',
      luigiConfigFragment: [
        {
          data: {
            nodeDefaults: {
              entityType: 'project',
              isolateView: false,
            },
            nodes: [
              {
                pathSegment: 'empty',
                label: '{{stackOverflow}}',
                category: {
                  label: 'Fundamental Demo Pages',
                  icon: 'dimension',
                  collapsible: true,
                },
                loadingIndicator: {
                  enabled: false,
                },
                url: 'https://fiddle.luigi-project.io/examples/microfrontends/fundamental/empty-demo-page.html',
                children: [
                  {
                    pathSegment: 'child',
                    label: 'Github Sample 2',
                    urlSuffix: '/#:projectId2/github',
                    keepSelectedForChildren: true,
                    children: [
                      {
                        pathSegment: 'grandchild',
                        label: 'Github Sample 2',
                        urlSuffix: '/#:projectId2/github',
                      },
                      {
                        pathSegment: 'grandchild2',
                        label: '{{stackOverflow}}',
                        urlSuffix: '/#:projectId2/github',
                      },
                    ],
                  },
                ],
              },
              {
                pathSegment: 'stack-2',
                label: '{{stackOverflow}}',
                category: 'Fundamental Demo Pages',
                url: 'https://fiddle.luigi-project.io/examples/microfrontends/fundamental/table-demo-page.html',
                virtualTree: true,
                icon: 'e-learning',
                visibleForFeatureToggles: ['enable-stack-search'],
              },
            ],
            texts: [
              {
                locale: 'en_UK',
                textDictionary: { stackOverflow: 'Stack Overflow' },
              },
            ],
          },
        },
        {
          data: {
            nodeDefaults: {
              entityType: 'component',
              isolateView: true,
            },
            nodes: [
              {
                entityType: 'project',
                pathSegment: 'stack',
                label: '{{gitHub}}',
                url: 'http://fiddle.luigi-project.io',
                virtualTree: false,
                icon: 'e-learning',
                visibleForFeatureToggles: ['enable-stack-search'],
              },
              {
                pathSegment: 'stack-2',
                label: '{{gitHub}}',
                isolateView: false,
                urlSuffix: '/#:projectId1/github',
                url: 'http://localhost:8080',
                virtualTree: true,
                icon: 'e-learning',
                visibleForFeatureToggles: ['enable-stack-search'],
              },
            ],
            texts: [
              {
                locale: 'en',
                textDictionary: {
                  stackOverflow: 'Stack Overflow',
                  gitHub: 'GitHub',
                },
              },
            ],
          },
        },
      ],
    };
  });

  const expected = [
    {
      category: {
        collapsible: true,
        icon: 'dimension',
        label: 'Fundamental Demo Pages',
      },
      children: [
        {
          children: [
            {
              children: [],
              entityType: 'project',
              isolateView: false,
              label: 'Github Sample 2',
              pathSegment: 'grandchild',
              urlSuffix: '/#:projectId2/github',
            },
            {
              children: [],
              entityType: 'project',
              isolateView: false,
              label: 'Stack Overflow',
              pathSegment: 'grandchild2',
              urlSuffix: '/#:projectId2/github',
            },
          ],
          entityType: 'project',
          isolateView: false,
          keepSelectedForChildren: true,
          label: 'Github Sample 2',
          pathSegment: 'child',
          urlSuffix: '/#:projectId2/github',
        },
      ],
      entityType: 'project',
      isolateView: false,
      label: 'Stack Overflow',
      loadingIndicator: {
        enabled: false,
      },
      pathSegment: 'empty',
      url: 'https://fiddle.luigi-project.io/examples/microfrontends/fundamental/empty-demo-page.html',
      viewUrl:
        'https://fiddle.luigi-project.io/examples/microfrontends/fundamental/empty-demo-page.html',
    },
    {
      category: 'Fundamental Demo Pages',
      children: [],
      entityType: 'project',
      icon: 'e-learning',
      isolateView: false,
      label: 'Stack Overflow',
      pathSegment: 'stack-2',
      url: 'https://fiddle.luigi-project.io/examples/microfrontends/fundamental/table-demo-page.html',
      viewUrl:
        'https://fiddle.luigi-project.io/examples/microfrontends/fundamental/table-demo-page.html',
      virtualTree: true,
      visibleForFeatureToggles: ['enable-stack-search'],
    },
    {
      children: [],
      entityType: 'project',
      icon: 'e-learning',
      isolateView: true,
      label: 'GitHub',
      pathSegment: 'stack',
      url: 'http://fiddle.luigi-project.io',
      viewUrl: 'http://fiddle.luigi-project.io',
      virtualTree: false,
      visibleForFeatureToggles: ['enable-stack-search'],
    },
    {
      children: [],
      entityType: 'component',
      icon: 'e-learning',
      isolateView: false,
      urlSuffix: '/#:projectId1/github',
      label: 'GitHub',
      pathSegment: 'stack-2',
      url: 'http://localhost:8080',
      viewUrl: 'http://localhost:8080',
      virtualTree: true,
      visibleForFeatureToggles: ['enable-stack-search'],
    },
  ];

  it('should process content configuration', async () => {
    // act
    const result = await service.processContentConfiguration(
      [ccJson],
      language
    );

    // assert
    expect(result).toEqual(expected);
  });

  it('should concatenate nodes', async () => {
    await expect(
      service.processContentConfiguration([ccJson, ccJson], language)
    ).resolves.toEqual([...expected, ...expected]);
  });

  it('should add help context to the node', async () => {
    // arrange
    const helpContext = {
      displayName: 'Some Extension',
      feedbackTracker: {
        url: 'some-url',
      },
    };

    // assert
    await expect(
      service.processContentConfiguration([ccJson], language, {
        helpContext,
      })
    ).resolves.toEqual(expected.map((e) => ({ ...e, helpContext })));
  });

  it('should add breadcrumbBadge to the node', async () => {
    // arrange
    const breadcrumbBadge: BreadcrumbBadge = {
      text: 'someText',
      colorSchema: '1',
      hint: 'text to show on hover',
    };

    // assert
    await expect(
      service.processContentConfiguration([ccJson], language, {
        breadcrumbBadge,
      })
    ).resolves.toEqual(expected.map((e) => ({ ...e, breadcrumbBadge })));
  });

  it('should add context to the node', async () => {
    // assert
    await expect(
      service.processContentConfiguration([ccJson], language, {
        isMissingMandatoryData: true,
        extensionClassName: 'extensionClassName',
      })
    ).resolves.toEqual(
      expected.map((e) => ({
        ...e,
        isMissingMandatoryData: true,
        context: { extensionClassName: 'extensionClassName' },
      }))
    );
  });
});
