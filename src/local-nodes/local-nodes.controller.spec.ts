import {
  ContentConfiguration,
  ContentConfigurationLuigiDataService,
  ContentConfigurationValidatorService,
  IntentResolveService,
  LuigiNode,
  ValidationResult,
} from '../config';
import { ConfigTransferNodeService } from '../config/luigi/luigi-data/config-transfer-node.service';
import { NodeExtendedDataService } from '../config/luigi/luigi-data/node-extended-data.service';
import { TextsTranslateService } from '../config/luigi/luigi-data/texts-translate.service';
import { ConfigDto, LocalNodesController } from './local-nodes.controller.js';
import { HttpModule } from '@nestjs/axios';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import type { Request, Response } from 'express';
import { mock } from 'jest-mock-extended';

describe('LocalNodesController', () => {
  let controller: LocalNodesController;
  let module: TestingModule;
  let contentConfigurationValidatorServiceMock: ContentConfigurationValidatorService;
  let contentConfigurationLuigiDataServiceMock: ContentConfigurationLuigiDataService;
  let body: Request;
  let responseMock: Response;

  beforeEach(async () => {
    jest.useFakeTimers();
    module = await Test.createTestingModule({
      controllers: [LocalNodesController],
      providers: [
        Logger,
        ContentConfigurationValidatorService,
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

    contentConfigurationValidatorServiceMock =
      module.get<ContentConfigurationValidatorService>(
        ContentConfigurationValidatorService,
      );

    contentConfigurationLuigiDataServiceMock =
      module.get<ContentConfigurationLuigiDataService>(
        ContentConfigurationLuigiDataService,
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
    const validationResults: ValidationResult[] = [
      {
        url: 'http://localhost:8080',
        parsedConfiguration:
          '{"name":"example","luigiConfigFragment":{"data":{"nodes":[],"texts":[]}}}',
      },
    ];

    jest
      .spyOn(
        contentConfigurationValidatorServiceMock,
        'validateContentConfigurations',
      )
      .mockResolvedValue(Promise.resolve(validationResults));

    jest
      .spyOn(contentConfigurationLuigiDataServiceMock, 'getLuigiData')
      .mockImplementation(() => {
        throw new Error();
      });

    //Act
    try {
      await controller.getLocalNodes(body, responseMock);
      fail();
    } catch (error: any) {
      //Assert
      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(error.message).toBe(
        'Could not process local content configuration',
      );
    }
  });

  describe('getLocalNodes', () => {
    it('should get no local nodes when no parameters', async () => {
      //Arrange
      const expectedResult: LuigiNode[] = undefined;
      const validationResults: ValidationResult[] = [
        {
          url: 'http://localhost:8080',
          parsedConfiguration:
            '{"name":"example","luigiConfigFragment":{"data":{"nodes":[],"texts":[]}}}',
        },
      ];

      jest
        .spyOn(
          contentConfigurationValidatorServiceMock,
          'validateContentConfigurations',
        )
        .mockResolvedValue(Promise.resolve(validationResults));

      jest
        .spyOn(contentConfigurationLuigiDataServiceMock, 'getLuigiData')
        .mockResolvedValue(Promise.resolve(expectedResult));

      //Act
      const result = await controller.getLocalNodes(body, responseMock);

      //Assert
      expect(result).toStrictEqual({ nodes: expectedResult });
    });

    it('should return HttpException when local nodes validator throws error', async () => {
      //Arrange
      const validationResult: ValidationResult = {
        url: 'http://localhost:8080',
        validationErrors: [
          {
            message: 'The document is not valid:\n%s',
          },
        ],
      };
      const validationResults: ValidationResult[] = [validationResult];

      jest
        .spyOn(
          contentConfigurationValidatorServiceMock,
          'validateContentConfigurations',
        )
        .mockResolvedValue(Promise.resolve(validationResults));

      //Act
      const result = await controller.getLocalNodes(body, responseMock);

      // Assert
      expect(result).toStrictEqual({ errors: [validationResult] });
    });

    it('should get local nodes', async () => {
      //Arrange
      const contentConfiguration = JSON.stringify(contentConfigurationToTest);
      const validationResults: ValidationResult[] = [
        {
          url: 'http://localhost:8080',
          parsedConfiguration: contentConfiguration,
        },
      ];

      jest
        .spyOn(
          contentConfigurationValidatorServiceMock,
          'validateContentConfigurations',
        )
        .mockResolvedValue(Promise.resolve(validationResults));

      body = mock<ConfigDto>();
      body = {
        language: 'any',
        contentConfigurations: [
          contentConfigurationToTest as ContentConfiguration,
        ],
      };

      //Act
      const result = await controller.getLocalNodes(body, responseMock);

      //Assert
      expect(result).toStrictEqual({ nodes: expectedResultFormProcessing });
    });
  });

  const expectedResultFormProcessing = [
    {
      _preloadUrl: 'http://localhost:8080/#/preload',
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
            viewUrl: 'http://localhost:8080/viewUrl',
          },
        },
      },
      children: [],
      context: {},
      dxpOrder: 6,
      entityType: 'global',
      hideSideNav: true,
      icon: 'business-one',
      isolateView: false,
      label: 'Catalog',
      order: 6,
      pathSegment: 'catalog',
      showBreadcrumbs: false,
      tabNav: true,
      urlSuffix: '/#/global-catalog',
      viewGroup: undefined,
      viewUrl: 'http://localhost:8080/#/global-catalog',
      visibleForFeatureToggles: ['!global-catalog'],
    },
    {
      children: [],
      context: {},
      dxpOrder: 6,
      entityType: 'global',
      hideSideNav: true,
      icon: 'business-one',
      isolateView: false,
      label: 'Catalog',
      order: 6,
      pathSegment: 'catalog',
      showBreadcrumbs: false,
      tabNav: true,
      urlSuffix: '/#/new-global-catalog',
      viewGroup: undefined,
      viewUrl: 'http://localhost:8080/#/new-global-catalog',
      visibleForFeatureToggles: ['global-catalog'],
    },
    {
      children: [
        {
          children: [],
          context: {
            extClassName: ':extClassName',
          },
          entityType: 'type',
          hideFromNav: true,
          isolateView: false,
          pathSegment: ':extClassName',
          urlSuffix: '/#/extensions/:extClassName',
          viewGroup: undefined,
          viewUrl: 'http://localhost:8080/#/extensions/:extClassName',
        },
      ],
      context: {},
      entityType: 'global',
      hideFromNav: true,
      isolateView: false,
      label: 'Extensions',
      pathSegment: 'extensions',
      viewGroup: undefined,
      viewUrl: undefined,
    },
  ];

  const contentConfigurationToTest = {
    creationTimestamp: undefined,
    name: 'extension-manager',
    contentType: 'json',
    url: 'http://localhost:8080',
    luigiConfigFragment: {
      data: {
        userSettings: {
          groups: {
            user1: {
              label: 'label',
              sublabel: 'sublabel',
              title: 'title',
              icon: 'icon',
              viewUrl: '/viewUrl',
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
          navMode: 'inplace',
          urlTemplateId: 'urltemplate.url',
          urlTemplateParams: {
            query: {},
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
