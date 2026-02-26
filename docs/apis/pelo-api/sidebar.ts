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
  ],
};

export default sidebar.apisidebar;
