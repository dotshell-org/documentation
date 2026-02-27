import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebar: SidebarsConfig = {
  apisidebar: [
    {
      type: "category",
      label: "Health",
      items: [
        {
          type: "doc",
          id: "apis/pelo-api/check-the-health-status-of-the-api",
          label: "Check the health status of the API",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Traffic",
      items: [
        {
          type: "doc",
          id: "apis/pelo-api/get-all-traffic-alerts",
          label: "Get all traffic alerts",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "apis/pelo-api/get-traffic-data-status",
          label: "Get traffic data status",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Vehicle Monitoring",
      items: [
        {
          type: "doc",
          id: "apis/pelo-api/get-vehicle-monitoring-positions",
          label: "Get vehicle monitoring positions",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "apis/pelo-api/get-vehicle-monitoring-data-status",
          label: "Get vehicle monitoring data status",
          className: "api-method get",
        },
      ],
    },
  ],
};

export default sidebar.apisidebar;
