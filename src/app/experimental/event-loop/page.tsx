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

import { EventLoopVisualizer } from "./_components/EventLoopVisualizer";

const experiment = getExperimentById("event-loop");
const title = experiment.title;
const description = experiment.description;
const path = experiment.path;

export const metadata: Metadata = buildPageMetadata({
  title,
  description,
  path,
  images: [getExperimentMetadataImage(experiment)],
});

export default function EventLoopPage() {
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

      <PageShell title={experiment.pageTitle} titleId="event-loop-visualizer">
        <ResponsiveContainer element="section" className="space-y-4">
          <div className="mx-auto max-w-4xl" data-testid="experiment-intro">
            <p className="text-body text-gray-300 md:text-center">
              This model shows a simplified JavaScript runtime: stack-first
              execution, then microtasks, then tasks. Use the examples to see
              why <code>Promise.then</code> callbacks run before{" "}
              <code>setTimeout(..., 0)</code> callbacks.
            </p>
          </div>
          <EventLoopVisualizer />
        </ResponsiveContainer>
      </PageShell>
    </>
  );
}
