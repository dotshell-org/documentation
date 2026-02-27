import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  librariesSidebar: [
    'libraries',
    {
      type: 'category',
      label: 'RAPTOR',
      link: {
        type: 'doc',
        id: 'libraries/raptor/index',
      },
      items: [
        {
          type: 'category',
          label: 'raptor-gtfs-pipeline',
          link: {
            type: 'doc',
            id: 'libraries/raptor/raptor-gtfs-pipeline/index',
          },
          items: [
            'libraries/raptor/raptor-gtfs-pipeline/getting-started',
            'libraries/raptor/raptor-gtfs-pipeline/cli-reference',
            'libraries/raptor/raptor-gtfs-pipeline/binary-format',
            'libraries/raptor/raptor-gtfs-pipeline/service-periods',
            'libraries/raptor/raptor-gtfs-pipeline/validation',
          ],
        },
        {
          type: 'category',
          label: 'raptor-kt',
          link: {
            type: 'doc',
            id: 'libraries/raptor/raptor-kt/index',
          },
          items: [
            'libraries/raptor/raptor-kt/getting-started',
            'libraries/raptor/raptor-kt/basic-api',
            'libraries/raptor/raptor-kt/multi-period',
            'libraries/raptor/raptor-kt/advanced-search',
            'libraries/raptor/raptor-kt/route-filtering',
            'libraries/raptor/raptor-kt/performance',
            'libraries/raptor/raptor-kt/android-integration',
          ],
        },
      ],
    }
  ],
  apisSidebar: [
    'apis',
    {
      type: 'category',
      label: 'Pelo API',
      link: {
        type: 'doc',
        id: 'apis/pelo-api',
      },
      items: [
        {
          type: 'category',
          label: 'Health',
          items: [
            {
              type: 'doc',
              id: 'apis/check-the-health-status-of-the-api',
              label: 'Check the health status of the API',
              className: 'api-method get',
            },
          ],
        },
        {
          type: 'category',
          label: 'Traffic',
          items: [
            {
              type: 'doc',
              id: 'apis/get-all-traffic-alerts',
              label: 'Get all traffic alerts',
              className: 'api-method get',
            },
            {
              type: 'doc',
              id: 'apis/get-traffic-data-status',
              label: 'Get traffic data status',
              className: 'api-method get',
            },
          ],
        },
        {
          type: 'category',
          label: 'Vehicle Monitoring',
          items: [
            {
              type: 'doc',
              id: 'apis/get-vehicle-monitoring-positions',
              label: 'Get vehicle monitoring positions',
              className: 'api-method get',
            },
            {
              type: 'doc',
              id: 'apis/get-vehicle-monitoring-data-status',
              label: 'Get vehicle monitoring data status',
              className: 'api-method get',
            },
          ],
        },
      ],
    },
  ],
};

export default sidebars;