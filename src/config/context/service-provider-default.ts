import { RawServiceProvider } from './service-provider.js';

export const DEFAULT_SERVICE_PROVIDERS: RawServiceProvider[] = [
  {
    name: 'getting-started',
    displayName: 'Getting Started',
    creationTimestamp: '',
    contentConfiguration: [
      {
        name: 'getting-started',
        creationTimestamp: '',
        luigiConfigFragment: {
          data: {
            nodes: [
              {
                entityType: 'global',
                pathSegment: 'home',
                label: 'Overview',
                icon: 'home',
                hideFromNav: true,
                defineEntity: {
                  id: 'example',
                },
                viewUrl: '/home',
                children: [
                  {
                    pathSegment: 'overview',
                    viewUrl: '/overview',
                    label: 'Overview',
                    icon: 'home',
                    url: '/assets/openmfp-portal-ui-wc.js#getting-started',
                    webcomponent: {
                      selfRegistered: true,
                    },
                  },
                ],
              },
            ],
          },
        },
      },
    ],
  },
];
