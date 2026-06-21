import { JsonLd } from "react-schemaorg";

import { Metadata } from "next";

import { WebPage } from "schema-dts";

import { JsonLdBreadcrumbs } from "@/components/JsonLdBreadcrumbs";
import { PageShell } from "@/components/PageShell";
import {
  buildExperimentBreadcrumbItems,
  getExperimentById,
  getExperimentMetadataImage,
} from "@/constants/experiments";
import { buildPageMetadata, buildWebPageSchema } from "@/lib/seo";

import { MandelbrotExplorer } from "./_components/MandelbrotExplorer";

const experiment = getExperimentById("mandelbrot");
const title = experiment.title;
const description = experiment.description;
const path = experiment.path;

export const metadata: Metadata = buildPageMetadata({
  title,
  description,
  path,
  images: [getExperimentMetadataImage(experiment)],
});

export default function MandelbrotPage() {
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

      <PageShell title={experiment.pageTitle} titleId="mandelbrot-explorer">
        <MandelbrotExplorer />
      </PageShell>
    </>
  );
}
