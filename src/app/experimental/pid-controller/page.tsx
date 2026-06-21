import { JsonLd } from "react-schemaorg";

import { Metadata } from "next";

import { WebPage } from "schema-dts";

import { JsonLdBreadcrumbs } from "@/components/JsonLdBreadcrumbs";
import { PageShell } from "@/components/PageShell";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import {
  buildExperimentBreadcrumbItems,
  getExperimentById,
  getExperimentMetadataImage,
} from "@/constants/experiments";
import { buildPageMetadata, buildWebPageSchema } from "@/lib/seo";

import { PidSimulatorWorkspace } from "./_components/PidSimulatorWorkspace";

const experiment = getExperimentById("pid-controller");
const title = experiment.title;
const description = experiment.description;
const path = experiment.path;

export const metadata: Metadata = buildPageMetadata({
  title,
  description,
  path,
  images: [getExperimentMetadataImage(experiment)],
});

export default function PidControllerPage() {
  return (
    <>
      <JsonLdBreadcrumbs
        items={buildExperimentBreadcrumbItems(experiment.pageTitle, path)}
      />
      <JsonLd<WebPage>
        item={buildWebPageSchema({
          path,
          title,
          description,
        })}
      />

      <PageShell title={experiment.pageTitle} titleId="pid-controller">
        <ResponsiveContainer element="section" className="space-y-6">
          <PidSimulatorWorkspace />
        </ResponsiveContainer>
      </PageShell>
    </>
  );
}
