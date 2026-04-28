import credentialedProxyHandler from "utils/proxy/handlers/credentialed";

const widget =  {
  api: "{url}/api/{endpoint}",
  proxyHandler: credentialedProxyHandler,

  mappings:  {
    health:  {
      endpoint: "settings.health" ,
    },
    projects: {
      endpoint: "/project.all",
    }
  },
};

export default widget;
