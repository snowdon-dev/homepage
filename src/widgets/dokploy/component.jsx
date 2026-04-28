import { useTranslation } from "next-i18next";
import Container from "components/services/widget/container";
import Block from "components/services/widget/block";
import useWidgetAPI from "utils/proxy/use-widget-api";

const MAX_ALLOWED_FIELDS = 4;

export default function Component({ service }) {
  const { t } = useTranslation();
  const { widget } = service;
  const fields = widget.fields?.length
    ? widget.fields.slice(0, MAX_ALLOWED_FIELDS)
    : ["status", "projects", "services", "up"];

  widget.fields = fields;
  const buildOpts = Object.fromEntries(fields.map((value) => [value, true]));
  const requireProjects = buildOpts.projects
    || buildOpts.services || buildOpts.up || buildOpts.error;

  const { data, error } = useWidgetAPI(widget, "health");
  const { data: dataProjects, error: errorProjects } = useWidgetAPI(
    widget,
    requireProjects ? "projects" : ""
  );

  // don't show health error, use ui instead. show a projects error
  let finalError = errorProjects;
  if (requireProjects && dataProjects && !Array.isArray(dataProjects)) {
    finalError = { message: "Invalid API response structure" };
  }
  if (finalError) {
    return <Container service={service} error={finalError} />;
  }
  // show loading values if all data is not present yet
  if ((buildOpts.status && !data && !error) || (requireProjects && !dataProjects)) {
    return (
      <Container service={service}>
        <Block label="dokploy.status" />
        <Block label="dokploy.projects" />
        <Block label="dokploy.services" />
        <Block label="dokploy.up" />
        <Block label="dokploy.error" />
      </Container>
    );
  }

  const extraCount = buildOpts.up || buildOpts.error;
  let serviceCount = 0, serviceUp = 0, serviceError = 0;
  try {
    if (requireProjects) {
      for (let i = 0 ; i < dataProjects.length; i++) {
        for (let j = 0; j < (dataProjects[i]?.environments.length ?? 0); j++) {
          const env = dataProjects[i].environments[j];

          if (buildOpts.services)
            serviceCount += env.applications.length + env.compose.length;

          if (extraCount)
            for (let k = 0; k < env.applications.length; k++) {
              const app = env.applications[k];
              if (buildOpts.up)
                serviceUp += app.applicationStatus === "done" ? 1 : 0;
              if (buildOpts.error)
                serviceError += app.applicationStatus === "error" ? 1 : 0;
            }

          if (extraCount)
            for (let f = 0; f < env.compose.length; f++) {
              const compose = env.compose[f];
              if (buildOpts.up)
                serviceUp += compose.composeStatus === "done" ? 1 : 0;
              if (buildOpts.error)
                serviceError += compose.composeStatus === "error" ? 1 : 0;
            }
        }
      }
    }
  } catch (e) {
    finalError = { message: "Invalid API structure: " + e.message };
    if (finalError) {
      return <Container service={service} error={finalError} />;
    }
  }

  return (
    <Container service={service}>
      <Block label="dokploy.status" value={data?.status === "ok" ? "Up" : "Down" } />
      <Block label="dokploy.projects" value={t("common.number", { value: (buildOpts.projects && dataProjects?.length) ?? 0 })} />
      <Block label="dokploy.services" value={t("common.number", { value: serviceCount })} />
      <Block label="dokploy.up" value={t("common.number", { value: serviceUp })} />
      <Block label="dokploy.error" value={t("common.number", { value: serviceError })} />
    </Container>
  );
}
