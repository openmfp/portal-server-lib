/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigDto, LocalNodesController } from './local-nodes.controller';
import {
  ContentConfigurationLuigiDataService,
  IntentResolveService,
  LuigiNode,
} from '../config';
import { TextsTranslateService } from '../config/luigi/luigi-data/texts-translate.service';
import { ConfigTransferNodeService } from '../config/luigi/luigi-data/config-transfer-node.service';
import { NodeExtendedDataService } from '../config/luigi/luigi-data/node-extended-data.service';
import { mock } from 'jest-mock-extended';
import { Request, Response } from 'express';

describe('LocalNodesController', () => {
  let controller: LocalNodesController;
  let module: TestingModule;
  let contentConfigurationLuigiDataServiceMock: ContentConfigurationLuigiDataService;
  let body: Request;
  let responseMock: Response;

  beforeEach(async () => {
    jest.useFakeTimers();
    module = await Test.createTestingModule({
      controllers: [LocalNodesController],
      providers: [
        Logger,
        ContentConfigurationLuigiDataService,
        TextsTranslateService,
        ConfigTransferNodeService,
        IntentResolveService,
        NodeExtendedDataService,
      ],
      imports: [HttpModule],
    }).compile();

    body = mock<ConfigDto>();
    responseMock = mock<Response>();
    contentConfigurationLuigiDataServiceMock =
      module.get<ContentConfigurationLuigiDataService>(
        ContentConfigurationLuigiDataService
      );
    controller = module.get<LocalNodesController>(LocalNodesController);
  });

  afterEach(async () => {
    jest.useRealTimers();
    await module.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return HttpException when getLuigiData throws error', async () => {
    //Arrange
    const expectedResult: LuigiNode[] = undefined;
    jest
      .spyOn(contentConfigurationLuigiDataServiceMock, 'getLuigiData')
      .mockImplementation(() => {
        throw new Error();
      });

    //Act
    try {
      await controller.getLocalNodes(body, responseMock);
    } catch (error: any) {
      //Assert
      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(error.message).toBe(
        'Could not process local content configuration'
      );
    }
  });

  describe('getLocalNodes', () => {
    it('should get no local nodes when no parameters', async () => {
      //Arrange
      const expectedResult: LuigiNode[] = undefined;
      jest
        .spyOn(contentConfigurationLuigiDataServiceMock, 'getLuigiData')
        .mockResolvedValue(Promise.resolve(expectedResult));

      //Act
      const result = await controller.getLocalNodes(body, responseMock);

      //Assert
      expect(result).toStrictEqual(expectedResult);
    });

    it('should get local nodes', async () => {
      //Arrange

      body = mock<ConfigDto>();
      body = {
        language: 'any',
        contentConfigurations: [contentConfigurationToTest],
      };

      //Act
      const result = await controller.getLocalNodes(body, responseMock);

      //Assert
      expect(result).toStrictEqual(expectedResultFormProcessing);
    });
  });

  const expectedResultFormProcessing = [
    {
      _preloadUrl: '/#/preload',
      _requiredIFramePermissionsForViewGroup: undefined,
      _userSettingsConfig: {
        groups: {
          user1: {
            icon: 'icon',
            label: 'label',
            settings: {
              option1: {
                isEditable: false,
                label: 'label',
                options: [],
                style: 'style',
                type: 'type',
              },
            },
            sublabel: 'sublabel',
            title: 'title',
            viewUrl: 'viewUrl',
          },
        },
      },
      breadcrumbBadge: undefined,
      children: [],
      context: undefined,
      dxpOrder: 6,
      entityType: 'global',
      helpContext: undefined,
      hideSideNav: true,
      icon: 'business-one',
      isMissingMandatoryData: undefined,
      isolateView: false,
      label: '{{catalog}}',
      order: 6,
      pathSegment: 'catalog',
      showBreadcrumbs: false,
      tabNav: true,
      urlSuffix: '/#/global-catalog',
      viewGroup: undefined,
      viewUrl: undefined,
      visibleForFeatureToggles: ['!global-catalog'],
    },
    {
      breadcrumbBadge: undefined,
      children: [],
      context: undefined,
      dxpOrder: 6,
      entityType: 'global',
      helpContext: undefined,
      hideSideNav: true,
      icon: 'business-one',
      isMissingMandatoryData: undefined,
      isolateView: false,
      label: '{{catalog}}',
      order: 6,
      pathSegment: 'catalog',
      showBreadcrumbs: false,
      tabNav: true,
      urlSuffix: '/#/new-global-catalog',
      viewGroup: undefined,
      viewUrl: undefined,
      visibleForFeatureToggles: ['global-catalog'],
    },
    {
      breadcrumbBadge: undefined,
      children: [
        {
          breadcrumbBadge: undefined,
          children: [],
          context: {
            extClassName: ':extClassName',
            extensionClassName: undefined,
          },
          entityType: 'type',
          helpContext: undefined,
          hideFromNav: true,
          isMissingMandatoryData: undefined,
          isolateView: false,
          pathSegment: ':extClassName',
          urlSuffix: '/#/extensions/:extClassName',
          viewGroup: undefined,
          viewUrl: undefined,
        },
      ],
      context: undefined,
      entityType: 'global',
      helpContext: undefined,
      hideFromNav: true,
      isMissingMandatoryData: undefined,
      isolateView: false,
      label: '{{extensions}}',
      pathSegment: 'extensions',
      viewGroup: undefined,
      viewUrl: undefined,
    },
  ];

  const contentConfigurationToTest = {
    name: 'extension-manager',
    contentType: 'json',
    luigiConfigFragment: {
      data: {
        userSettings: {
          groups: {
            user1: {
              label: 'label',
              sublabel: 'sublabel',
              title: 'title',
              icon: 'icon',
              viewUrl: 'viewUrl',
              settings: {
                option1: {
                  type: 'type',
                  label: 'label',
                  style: 'style',
                  options: [],
                  isEditable: false,
                },
              },
            },
          },
        },
        nodeDefaults: {
          entityType: 'type',
          isolateView: false,
        },
        targetAppConfig: {
          _version: '1.13.0',
          'sap.integration': {
            navMode: 'inplace',
            urlTemplateId: 'urltemplate.url',
            urlTemplateParams: {
              query: {},
            },
          },
        },
        viewGroup: {
          preloadSuffix: '/#/preload',
        },
        nodes: [
          {
            entityType: 'global',
            pathSegment: 'catalog',
            label: '{{catalog}}',
            icon: 'business-one',
            dxpOrder: 6,
            order: 6,
            hideSideNav: true,
            tabNav: true,
            showBreadcrumbs: false,
            urlSuffix: '/#/global-catalog',
            visibleForFeatureToggles: ['!global-catalog'],
          },
          {
            entityType: 'global',
            pathSegment: 'catalog',
            label: '{{catalog}}',
            icon: 'business-one',
            dxpOrder: 6,
            order: 6,
            hideSideNav: true,
            tabNav: true,
            showBreadcrumbs: false,
            urlSuffix: '/#/new-global-catalog',
            visibleForFeatureToggles: ['global-catalog'],
          },
          {
            entityType: 'global',
            pathSegment: 'extensions',
            label: '{{extensions}}',
            hideFromNav: true,
            children: [
              {
                pathSegment: ':extClassName',
                hideFromNav: true,
                urlSuffix: '/#/extensions/:extClassName',
                context: {
                  extClassName: ':extClassName',
                },
              },
            ],
          },
        ],
        texts: [
          {
            locale: '',
            textDictionary: {
              catalog: 'Catalog',
              extensions: 'Extensions',
            },
          },
          {
            locale: 'en',
            textDictionary: {
              catalog: 'Catalog',
              extensions: 'Extensions',
            },
          },
          {
            locale: 'de',
            textDictionary: {
              catalog: 'Katalog',
              extensions: 'Erweiterungen',
            },
          },
        ],
      },
    },
  };
});
