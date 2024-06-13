// import { HttpModule, HttpService } from '@nestjs/axios';
// import { Test, TestingModule } from '@nestjs/testing';
// import {
//   CrossNavigationInbounds,
//   LuigiIntent,
//   LuigiNode,
// } from '../../model/luigi.node';
// import { BreadcrumbBadge } from '../../model/breadcrumb-badge';
// import { ContentConfigurationLuigiDataService } from './content-configuration-luigi-data.service';
// import { mock } from 'jest-mock-extended';
// import {
//   ContentConfiguration,
//   Dictionary,
//   LuigiNodeDefaults,
// } from '../../model/configuration';
//
// describe('ContentConfigurationLuigiDataService', () => {
//   let service: ContentConfigurationLuigiDataService;
//   const baseUrl = 'https://github.tools.sap';
//   const pathToCdmJson = '/path/cmd.json';
//   const urlToCdmJson = baseUrl + pathToCdmJson;
//   const language = 'en';
//   let consoleWarn;
//
//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [ContentConfigurationLuigiDataService],
//       imports: [HttpModule],
//     }).compile();
//     service = module.get<ContentConfigurationLuigiDataService>(
//       ContentConfigurationLuigiDataService
//     );
//
//     consoleWarn = jest.spyOn(global.console, 'warn').mockImplementation();
//   });
//
//   it('should be defined', () => {
//     expect(service).toBeDefined();
//   });
//
//   describe('config configuration', () => {
//     let ccJson: ContentConfiguration;
//
//     const expectedNode = {
//       _entityRelativePaths: {},
//       _intentMappings: [],
//       children: [],
//       entityType: 'project',
//       icon: 'e-learning',
//       label: '{{stackOverflow}}',
//       pathSegment: 'stack',
//       viewUrl:
//         '{context.serviceProviderConfig.searchMicroFrontendUrl}/#/search/stack?q=tag:{context.serviceProviderConfig.tag}%20',
//       virtualTree: false,
//       visibleForFeatureToggles: ['enable-stack-search'],
//     };
//
//     beforeEach(() => {
//       ccJson = {
//         name: 'CC-1',
//         creationTimestamp: '2022-05-17T11:37:17Z',
//         luigiConfigFragment: [
//           {
//             data: {
//               nodeDefaults: {
//                 entityType: 'project',
//                 isolateView: false,
//               },
//               nodes: [
//                 {
//                   entityType: 'project',
//                   pathSegment: 'stack',
//                   label: '{{stackOverflow}}',
//                   url: '{context.serviceProviderConfig.searchMicroFrontendUrl}/#/search/stack?q=tag:{context.serviceProviderConfig.tag}%20',
//                   virtualTree: false,
//                   icon: 'e-learning',
//                   visibleForFeatureToggles: ['enable-stack-search'],
//                 },
//                 {
//                   pathSegment: 'stack-2',
//                   label: '{{stackOverflow}}',
//                   url: '{context.serviceProviderConfig.searchMicroFrontendUrl}/#/search/stack?q=tag:{context.serviceProviderConfig.tag}%20',
//                   virtualTree: true,
//                   icon: 'e-learning',
//                   visibleForFeatureToggles: ['enable-stack-search'],
//                 },
//               ],
//               texts: [
//                 {
//                   locale: 'en',
//                   textDictionary: { stackOverflow: 'Stack Overflow' },
//                 },
//               ],
//             },
//           },
//           {
//             data: {
//               nodeDefaults: {
//                 entityType: 'component',
//                 isolateView: false,
//               },
//               nodes: [
//                 {
//                   entityType: 'project',
//                   pathSegment: 'stack',
//                   label: '{{gitHub}}',
//                   url: '{context.serviceProviderConfig.searchMicroFrontendUrl}/#/search/stack?q=tag:{context.serviceProviderConfig.tag}%20',
//                   virtualTree: false,
//                   icon: 'e-learning',
//                   visibleForFeatureToggles: ['enable-stack-search'],
//                 },
//                 {
//                   pathSegment: 'stack-2',
//                   label: '{{gitHub}}',
//                   url: '{context.serviceProviderConfig.searchMicroFrontendUrl}/#/search/stack?q=tag:{context.serviceProviderConfig.tag}%20',
//                   virtualTree: true,
//                   icon: 'e-learning',
//                   visibleForFeatureToggles: ['enable-stack-search'],
//                 },
//               ],
//               texts: [
//                 {
//                   locale: 'en',
//                   textDictionary: {
//                     stackOverflow: 'Stack Overflow',
//                     gitHub: 'GitHub',
//                   },
//                 },
//               ],
//             },
//           },
//         ],
//       };
//     });
//
//     it('should use data if present', async () => {
//       await expect(
//         service.processContentConfiguration([ccJson], language)
//       ).resolves.toEqual([expectedNode]);
//     });
//
//     it('should concatenate nodes', async () => {
//       await expect(
//         service.processContentConfiguration([ccJson, ccJson], language)
//       ).resolves.toEqual([expectedNode, expectedNode]);
//     });
//
//     it('should add help context to the node', async () => {
//       const helpContext = {
//         displayName: 'Some Extension',
//         feedbackTracker: {
//           url: 'some-url',
//         },
//       };
//       await expect(
//         service.processContentConfiguration([ccJson], language, {
//           helpContext,
//         })
//       ).resolves.toEqual([{ ...expectedNode, helpContext }]);
//     });
//
//     it('should add breadcrumbBadge the node', async () => {
//       const breadcrumbBadge: BreadcrumbBadge = {
//         text: 'someText',
//         colorSchema: '1',
//         hint: 'text to show on hover',
//       };
//       await expect(
//         service.processContentConfiguration([ccJson], language, {
//           breadcrumbBadge,
//         })
//       ).resolves.toEqual([{ ...expectedNode, breadcrumbBadge }]);
//     });
//   });
//
//   // describe('Processing data model', () => {
//   //   describe('with a single node', () => {
//   //     let cdmJson: Record<string, any>;
//   //     const preloadUrl = '/mock';
//   //     const urlSuffix = '/#:projectId2/github';
//   //
//   //     beforeEach(() => {
//   //       nock.cleanAll();
//   //       cdmJson = {
//   //         payload: {
//   //           visualizations: {
//   //             LuigiNavConfig: {
//   //               vizConfig: {
//   //                 viewGroup: {
//   //                   preloadSuffix: preloadUrl,
//   //                   requiredIFramePermissions: {
//   //                     allow: ['allow'],
//   //                     sandbox: ['sandbox'],
//   //                   },
//   //                 },
//   //                 nodes: [
//   //                   {
//   //                     pathSegment: 'github',
//   //                     label: 'Github Sample',
//   //                     urlSuffix: urlSuffix,
//   //                     requiredIFramePermissions: {
//   //                       allow: ['clipboard-read'],
//   //                       sandbox: ['allow-forms'],
//   //                     },
//   //                   },
//   //                 ],
//   //               },
//   //             },
//   //           },
//   //           targetAppConfig: {
//   //             'sap.integration': {
//   //               urlTemplateParams: {},
//   //             },
//   //           },
//   //         },
//   //       };
//   //     });
//   //
//   //     it('having correct node in cdm.json', async () => {
//   //       // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
//   //       cdmJson.payload.targetAppConfig[
//   //         'sap.integration'
//   //       ].urlTemplateParams.url = baseUrl;
//   //
//   //       nock(baseUrl).get(pathToCdmJson).query(true).reply(200, cdmJson);
//   //       const nodes = await service.processContentConfiguration(
//   //         [{ url: urlToCdmJson }],
//   //         null,
//   //         language
//   //       );
//   //       expect(nodes).toBeDefined();
//   //       expect(nodes).toHaveLength(1);
//   //       expect(nodes).toEqual([
//   //         {
//   //           _dxpPreloadUrl: baseUrl + preloadUrl,
//   //           _requiredIFramePermissionsForViewGroup: {
//   //             allow: ['allow'],
//   //             sandbox: ['sandbox'],
//   //           },
//   //           _entityRelativePaths: {},
//   //           _intentMappings: [],
//   //           category: undefined,
//   //           children: [],
//   //           entityType: undefined,
//   //           externalLink: undefined,
//   //           hideFromNav: undefined,
//   //           hideSideNav: undefined,
//   //           isolateView: undefined,
//   //           label: 'Github Sample',
//   //           loadingIndicator: undefined,
//   //           pathSegment: 'github',
//   //           useHashRouting: undefined,
//   //           viewGroup: baseUrl,
//   //           viewUrl: baseUrl + urlSuffix,
//   //           virtualTree: undefined,
//   //           requiredIFramePermissions: {
//   //             allow: ['clipboard-read'],
//   //             sandbox: ['allow-forms'],
//   //           },
//   //         },
//   //       ]);
//   //     });
//   //
//   //     it('should build a url if a relative url is given for a single node', async () => {
//   //       nock(baseUrl).get(pathToCdmJson).query(true).reply(200, cdmJson);
//   //
//   //       const nodes = await service.processContentConfiguration(
//   //         [{ url: urlToCdmJson }],
//   //         null,
//   //         language
//   //       );
//   //       expect(nodes).toBeDefined();
//   //       expect(nodes).toHaveLength(1);
//   //       expect(nodes[0].viewUrl).toBe(`${baseUrl}${urlSuffix}`);
//   //       expect(nodes[0]._dxpPreloadUrl).toBe(`${baseUrl}${preloadUrl}`);
//   //     });
//   //   });
//   //
//   //   it('having correct multiple nodes in cdm.json', async () => {
//   //     const cdmJson = {
//   //       payload: {
//   //         visualizations: {
//   //           LuigiNavConfig: {
//   //             vizConfig: {
//   //               viewGroup: {
//   //                 preloadSuffix: '/mock',
//   //               },
//   //               nodes: [
//   //                 {
//   //                   pathSegment: 'github',
//   //                   label: 'Github Sample 1',
//   //                   urlSuffix: '/#:projectId1/github',
//   //                 },
//   //                 {
//   //                   pathSegment: 'github',
//   //                   label: 'Github Sample 2',
//   //                   urlSuffix: '/#:projectId2/github',
//   //                 },
//   //               ],
//   //             },
//   //           },
//   //         },
//   //         targetAppConfig: {
//   //           'sap.integration': {
//   //             urlTemplateParams: {
//   //               url: baseUrl,
//   //             },
//   //           },
//   //         },
//   //       },
//   //     };
//   //     nock(baseUrl).get(pathToCdmJson).query(true).reply(200, cdmJson);
//   //     const nodes = await service.processContentConfiguration(
//   //       [{ url: urlToCdmJson }],
//   //       null,
//   //       language
//   //     );
//   //     expect(nodes).toBeDefined();
//   //     expect(nodes).toHaveLength(2);
//   //   });
//   //
//   //   it('having correct multi-level child nodes in cdm.json', async () => {
//   //     const cdmJson = {
//   //       payload: {
//   //         visualizations: {
//   //           LuigiNavConfig: {
//   //             vizConfig: {
//   //               viewGroup: {
//   //                 preloadSuffix: '/mock',
//   //               },
//   //               nodes: [
//   //                 {
//   //                   pathSegment: 'github',
//   //                   label: 'Github Sample 1',
//   //                   urlSuffix: '/#:projectId1/github',
//   //                   children: [
//   //                     {
//   //                       pathSegment: 'child',
//   //                       label: 'Github Sample 2',
//   //                       urlSuffix: '/#:projectId2/github',
//   //                       keepSelectedForChildren: true,
//   //                       children: [
//   //                         {
//   //                           pathSegment: 'grandchild',
//   //                           label: 'Github Sample 2',
//   //                           urlSuffix: '/#:projectId2/github',
//   //                         },
//   //                         {
//   //                           pathSegment: 'grandchild2',
//   //                           label: 'Github Sample 2',
//   //                           urlSuffix: '/#:projectId2/github',
//   //                         },
//   //                       ],
//   //                     },
//   //                   ],
//   //                 },
//   //               ],
//   //             },
//   //           },
//   //         },
//   //         targetAppConfig: {
//   //           'sap.integration': {
//   //             urlTemplateParams: {
//   //               url: baseUrl,
//   //             },
//   //           },
//   //         },
//   //       },
//   //     };
//   //     nock(baseUrl).get(pathToCdmJson).query(true).reply(200, cdmJson);
//   //     const nodes: LuigiNode[] = await service.processContentConfiguration(
//   //       [{ url: urlToCdmJson }],
//   //       null,
//   //       language
//   //     );
//   //     expect(nodes).toBeDefined();
//   //     expect(nodes).toHaveLength(1);
//   //     const children: LuigiNode[] = nodes[0].children as LuigiNode[];
//   //     expect(children).toHaveLength(1);
//   //     expect(children[0].children).toHaveLength(2);
//   //     expect(children[0].keepSelectedForChildren).toBe(true);
//   //   });
//   //
//   //   it('having incorrect nodes in cdm.json', async () => {
//   //     const cdmJson = {
//   //       payload: {
//   //         visualizations: {
//   //           LuigiNavConfig: {
//   //             vizConfig: {
//   //               viewGroup: {
//   //                 preloadSuffix: '/mock',
//   //               },
//   //               nodes: 'shouldBeAnArray',
//   //             },
//   //           },
//   //         },
//   //         targetAppConfig: {
//   //           'sap.integration': {
//   //             urlTemplateParams: {
//   //               url: baseUrl,
//   //             },
//   //           },
//   //         },
//   //       },
//   //     };
//   //     nock(baseUrl).get(pathToCdmJson).query(true).reply(200, cdmJson);
//   //     await expect(
//   //       service.processContentConfiguration([{ url: urlToCdmJson }], language)
//   //     ).resolves.toEqual([]);
//   //     expect(consoleWarn).toHaveBeenCalled();
//   //   });
//   //
//   //   it('with empty cdm.json', async () => {
//   //     nock(baseUrl).get(pathToCdmJson).query(true).reply(200, {});
//   //     await expect(
//   //       service.processContentConfiguration([{ url: urlToCdmJson }], language)
//   //     ).resolves.toEqual([]);
//   //     expect(consoleWarn).toHaveBeenCalled();
//   //   });
//   //
//   //   it('with illegal cdm.json', async () => {
//   //     nock(baseUrl).get(pathToCdmJson).query(true).reply(200, 'notAJson');
//   //     await expect(
//   //       service.processContentConfiguration([{ url: urlToCdmJson }], language)
//   //     ).resolves.toEqual([]);
//   //     expect(consoleWarn).toHaveBeenCalled();
//   //   });
//   //
//   //   it('with empty payload property in cdm.json', async () => {
//   //     const cdmJson = { payload: {} };
//   //     nock(baseUrl).get(pathToCdmJson).query(true).reply(200, cdmJson);
//   //     await expect(
//   //       service.processContentConfiguration([{ url: urlToCdmJson }], language)
//   //     ).resolves.toEqual([]);
//   //     expect(consoleWarn).toHaveBeenCalled();
//   //   });
//   //
//   //   it('with missing targetAppConfig property cdm.json', async () => {
//   //     const cdmJson = {
//   //       payload: {
//   //         visualizations: {
//   //           LuigiNavConfig: {
//   //             vizConfig: {
//   //               viewGroup: {
//   //                 preloadSuffix: '/mock',
//   //               },
//   //               label: 'Mock nav entry',
//   //               pathSegment: '/home',
//   //             },
//   //           },
//   //         },
//   //       },
//   //     };
//   //     nock(baseUrl).get(pathToCdmJson).query(true).reply(200, cdmJson);
//   //     await expect(
//   //       service.processContentConfiguration([{ url: urlToCdmJson }], language)
//   //     ).resolves.toEqual([]);
//   //     expect(consoleWarn).toHaveBeenCalled();
//   //   });
//   //
//   //   it('with missing visualizations property cdm.json', async () => {
//   //     const cdmJson = {
//   //       payload: {
//   //         targetAppConfig: {
//   //           'sap.integration': {
//   //             urlTemplateParams: {
//   //               url: baseUrl,
//   //             },
//   //           },
//   //         },
//   //       },
//   //     };
//   //     nock(baseUrl).get(pathToCdmJson).query(true).reply(200, cdmJson);
//   //     await expect(
//   //       service.processContentConfiguration([{ url: urlToCdmJson }], language)
//   //     ).resolves.toEqual([]);
//   //     expect(consoleWarn).toHaveBeenCalled();
//   //   });
//   // });
//   //
//   // it('having correct node defaults', async () => {
//   //   const cdmJson = {
//   //     payload: {
//   //       visualizations: {
//   //         LuigiNavConfig: {
//   //           vizConfig: {
//   //             viewGroup: {
//   //               preloadSuffix: '/mock',
//   //             },
//   //             nodeDefaults: {
//   //               isolateView: true,
//   //             },
//   //             nodes: [
//   //               {
//   //                 pathSegment: 'github',
//   //                 label: 'Github Sample 1',
//   //                 urlSuffix: '/#:projectId1/github',
//   //                 children: [
//   //                   {
//   //                     pathSegment: 'child',
//   //                     label: 'Github Sample 2',
//   //                     urlSuffix: '/#:projectId2/github',
//   //                     keepSelectedForChildren: true,
//   //                     children: [
//   //                       {
//   //                         pathSegment: 'grandchild',
//   //                         label: 'Github Sample 2',
//   //                         urlSuffix: '/#:projectId2/github',
//   //                       },
//   //                       {
//   //                         pathSegment: 'grandchild2',
//   //                         label: 'Github Sample 2',
//   //                         isolateView: false,
//   //                         urlSuffix: '/#:projectId2/github',
//   //                       },
//   //                     ],
//   //                   },
//   //                 ],
//   //               },
//   //             ],
//   //           },
//   //         },
//   //       },
//   //       targetAppConfig: {
//   //         'sap.integration': {
//   //           urlTemplateParams: {
//   //             url: baseUrl,
//   //           },
//   //         },
//   //       },
//   //     },
//   //   };
//   //   nock(baseUrl).get(pathToCdmJson).query(true).reply(200, cdmJson);
//   //   const nodes = await service.processContentConfiguration(
//   //     [{ url: urlToCdmJson }],
//   //     language
//   //   );
//   //   expect(nodes).toBeDefined();
//   //   expect(nodes).toHaveLength(1);
//   //   const luigiNode: LuigiNode = nodes[0];
//   //   expect(luigiNode.isolateView).toBe(true);
//   //   const children: LuigiNode[] = luigiNode.children as LuigiNode[];
//   //   const child: LuigiNode = children[0];
//   //   expect(child.isolateView).toBe(true);
//   //   const grandChildren = child.children as LuigiNode[];
//   //   expect(grandChildren[0].isolateView).toBe(true);
//   //   expect(grandChildren[1].isolateView).toBe(false);
//   // });
//   //
//   // it('resolves intent target correctly', () => {
//   //   const luigiNodes: LuigiNode[] = [
//   //     {
//   //       pathSegment: 'sample',
//   //       label: 'someLabel',
//   //       hideFromNav: true,
//   //     },
//   //     {
//   //       pathSegment: 'metal',
//   //       label: 'Metal',
//   //       hideFromNav: true,
//   //       entityType: 'project.component',
//   //       children: [
//   //         {
//   //           pathSegment: 'iron',
//   //           target: {
//   //             type: 'IBN',
//   //             inboundId: 'ironId',
//   //           },
//   //         },
//   //       ],
//   //     },
//   //     {
//   //       pathSegment: 'sample',
//   //       label: 'LabelWithTarget',
//   //       hideFromNav: true,
//   //       entityType: 'project',
//   //       target: {
//   //         type: 'IBN',
//   //         inboundId: 'templateId',
//   //       },
//   //     },
//   //     {
//   //       pathSegment: 'sample',
//   //       label: 'someLabel',
//   //       hideFromNav: true,
//   //       target: {
//   //         type: 'IBN',
//   //         inboundId: 'notExist',
//   //       },
//   //     },
//   //     {
//   //       pathSegment: 'projects',
//   //       entityType: 'global',
//   //       children: [
//   //         {
//   //           pathSegment: ':projectId',
//   //           defineEntity: {
//   //             id: 'project',
//   //           },
//   //           children: [
//   //             {
//   //               pathSegment: 'components',
//   //               children: [
//   //                 {
//   //                   pathSegment: ':componentId',
//   //                   defineEntity: {
//   //                     id: 'component',
//   //                   },
//   //                 },
//   //               ],
//   //             },
//   //           ],
//   //         },
//   //       ],
//   //     },
//   //   ];
//   //
//   //   const inbounds: CrossNavigationInbounds = {
//   //     id1: {
//   //       semanticObject: 'Sales',
//   //       action: 'view',
//   //     },
//   //     id2: {
//   //       semanticObject: 'Game',
//   //       action: 'view',
//   //     },
//   //     id3: {
//   //       semanticObject: 'Munich',
//   //       action: 'view',
//   //     },
//   //     templateId: {
//   //       semanticObject: 'Templates',
//   //       action: 'view',
//   //     },
//   //     ironId: {
//   //       semanticObject: 'Iron',
//   //       action: 'view',
//   //     },
//   //   };
//   //
//   //   const expectedIntentMapping: LuigiIntent[] = [
//   //     {
//   //       baseEntityId: 'project.component',
//   //       relativePath: '/metal/iron',
//   //       semanticObject: 'Iron',
//   //       action: 'view',
//   //       // pathSegment: should be undefined here
//   //     },
//   //     {
//   //       baseEntityId: 'project',
//   //       relativePath: '/sample',
//   //       semanticObject: 'Templates',
//   //       action: 'view',
//   //       // pathSegment: should be undefined here
//   //     },
//   //   ];
//   //
//   //   const expectedEntityRelativePath = {
//   //     project: { pathSegment: '/projects/:projectId', parentEntity: 'global' },
//   //     component: {
//   //       pathSegment: '/components/:componentId',
//   //       parentEntity: 'project',
//   //     },
//   //   };
//   //
//   //   const expectedMapping = {
//   //     entityRelativePaths: expectedEntityRelativePath,
//   //     intentMappings: expectedIntentMapping,
//   //   };
//   //
//   //   const intentMappings = service.resolveIntentTargetsAndEntityPath(
//   //     luigiNodes,
//   //     inbounds
//   //   );
//   //   expect(intentMappings).toBeDefined();
//   //   expect(intentMappings).toStrictEqual(expectedMapping);
//   // });
// });
