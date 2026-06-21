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

import { LoadFlowWorkspace } from "./_components/LoadFlowWorkspace";

const experiment = getExperimentById("load-flow");
const title = experiment.title;
const description = experiment.description;
const path = experiment.path;

export const metadata: Metadata = buildPageMetadata({
  title,
  description,
  path,
  images: [getExperimentMetadataImage(experiment)],
});

export default function LoadFlowPage() {
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

      <PageShell title={experiment.pageTitle} titleId="load-flow">
        <ResponsiveContainer element="section" className="space-y-6">
          <p className="text-body text-gray-300">
            This workspace uses a Newton-Raphson AC load flow engine with
            reference scenarios, bus-voltage results, and branch-flow outputs.
            You can start from a standard benchmark case or build and tune a
            custom one-line model directly in the browser.
          </p>
          <LoadFlowWorkspace />
        </ResponsiveContainer>
      </PageShell>
    </>
  );
}
