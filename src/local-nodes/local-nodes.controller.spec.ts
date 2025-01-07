/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigDto, LocalNodesController } from './local-nodes.controller';
import {
  ContentConfiguration,
  ContentConfigurationLuigiDataService,
  ContentConfigurationValidatorService,
  IntentResolveService,
  LuigiNode,
} from '../config';
import { TextsTranslateService } from '../config/luigi/luigi-data/texts-translate.service';
import { ConfigTransferNodeService } from '../config/luigi/luigi-data/config-transfer-node.service';
import { NodeExtendedDataService } from '../config/luigi/luigi-data/node-extended-data.service';
import { mock, MockProxy } from 'jest-mock-extended';
import { Request, Response } from 'express';
import { LOCAL_NODES_VALIDATOR_INJECTION_TOKEN } from '../injection-tokens';
import { AxiosResponse } from 'axios';
import { LocalNodesValidatorServiceImpl, ValidationResult } from './local-nodes-validator-service';

describe('LocalNodesController', () => {
  let controller: LocalNodesController;
  let module: TestingModule;
  let contentConfigurationValidatorServiceMock: ContentConfigurationValidatorService;
  let contentConfigurationLuigiDataServiceMock: ContentConfigurationLuigiDataService;
  let body: Request;
  let responseMock: Response;
  let localNodesValidatorMock: MockProxy<LocalNodesValidatorServiceImpl>;

  beforeEach(async () => {
    localNodesValidatorMock = mock<LocalNodesValidatorServiceImpl>();
    jest.useFakeTimers();
    module = await Test.createTestingModule({
      controllers: [LocalNodesController],
      providers: [
        {
          provide: LOCAL_NODES_VALIDATOR_INJECTION_TOKEN,
          useValue: localNodesValidatorMock,
        },
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
        ContentConfigurationValidatorService
      );

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
      const validationResult:  AxiosResponse<ValidationResult, any>[] = [{
        data: {
          parsedConfiguration: "{\"name\":\"example\",\"luigiConfigFragment\":{\"data\":{\"nodes\":[],\"texts\":[]}}}",
        },
        status: 200,
      } as AxiosResponse];

      jest
        .spyOn(contentConfigurationValidatorServiceMock, 'validateContentConfiguration')
        .mockResolvedValue(Promise.resolve(validationResult));

      jest
        .spyOn(contentConfigurationLuigiDataServiceMock, 'getLuigiData')
        .mockResolvedValue(Promise.resolve(expectedResult));

      //Act
      const result = await controller.getLocalNodes(body, responseMock);

      //Assert
      expect(result).toStrictEqual(expectedResult);
    });

    it('should return HttpException when local nodes validator throws error', async () => {
      //Arrange
      const validationResult:  AxiosResponse<ValidationResult, any>[] = [{
        data: {
          "validationErrors": [
              {
                  "message": "The document is not valid:\n%s"
              }
          ]
      },
        status: 200,
      } as AxiosResponse];

      jest
        .spyOn(contentConfigurationValidatorServiceMock, 'validateContentConfiguration')
        .mockResolvedValue(Promise.resolve(validationResult));

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

    it('should get local nodes', async () => {
      //Arrange
      const contentConfiguration = JSON.stringify(contentConfigurationToTest);
      const validationResult:  AxiosResponse<ValidationResult, any>[] = [{
        data: {
          parsedConfiguration: contentConfiguration
        },
        status: 200,
      } as AxiosResponse];
      
      jest
      .spyOn(contentConfigurationValidatorServiceMock, 'validateContentConfiguration')
      .mockResolvedValue(Promise.resolve(validationResult));
      
      body = mock<ConfigDto>();
      body = {
        language: 'any',
        contentConfigurations: [contentConfigurationToTest as ContentConfiguration],
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
      context: {},
      dxpOrder: 6,
      entityType: 'global',
      helpContext: undefined,
      hideSideNav: true,
      icon: 'business-one',
      isMissingMandatoryData: undefined,
      isolateView: false,
      label: 'Catalog',
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
      context: {},
      dxpOrder: 6,
      entityType: 'global',
      helpContext: undefined,
      hideSideNav: true,
      icon: 'business-one',
      isMissingMandatoryData: undefined,
      isolateView: false,
      label: 'Catalog',
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
      context: {},
      entityType: 'global',
      helpContext: undefined,
      hideFromNav: true,
      isMissingMandatoryData: undefined,
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
