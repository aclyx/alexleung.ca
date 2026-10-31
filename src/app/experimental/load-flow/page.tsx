import { JsonLd } from "react-schemaorg";

import { Metadata } from "next";

import { WebPage } from "schema-dts";

import { JsonLdBreadcrumbs } from "@/components/JsonLdBreadcrumbs";
import { PageShell } from "@/components/PageShell";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { getBrowserToolShareImages } from "@/constants/browserTools";
import {
  LOAD_FLOW_DESCRIPTION,
  LOAD_FLOW_PATH,
  LOAD_FLOW_TITLE,
} from "@/constants/loadFlow";
import { buildPageMetadata, buildWebPageSchema } from "@/lib/seo";

import { LoadFlowWorkspace } from "./_components/LoadFlowWorkspace";

export const metadata: Metadata = buildPageMetadata({
  title: `${LOAD_FLOW_TITLE} | Alex Leung`,
  description: LOAD_FLOW_DESCRIPTION,
  path: LOAD_FLOW_PATH,
  images: getBrowserToolShareImages("load-flow"),
});

export default function LoadFlowPage() {
  return (
    <>
      <JsonLdBreadcrumbs
        items={[
          { name: "Home", item: "/" },
          { name: LOAD_FLOW_TITLE, item: LOAD_FLOW_PATH },
        ]}
      />
      <JsonLd<WebPage>
        item={buildWebPageSchema({
          path: LOAD_FLOW_PATH,
          title: LOAD_FLOW_TITLE,
          description: LOAD_FLOW_DESCRIPTION,
        })}
      />
      <PageShell
        title={LOAD_FLOW_TITLE}
        titleId="load-flow"
        description="Change the load. See where power flows and how voltages respond."
      >
        <ResponsiveContainer>
          <LoadFlowWorkspace />
        </ResponsiveContainer>
      </PageShell>
    </>
  );
}
