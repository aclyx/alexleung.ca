import { JsonLd } from "react-schemaorg";

import { Metadata } from "next";

import { WebPage } from "schema-dts";

import { JsonLdBreadcrumbs } from "@/components/JsonLdBreadcrumbs";
import { PageShell } from "@/components/PageShell";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import {
  PID_CONTROLLER_DESCRIPTION,
  PID_CONTROLLER_PAGE_TITLE,
  PID_CONTROLLER_PATH,
  PID_CONTROLLER_TITLE,
} from "@/constants/pidController";
import { buildPageMetadata, buildWebPageSchema } from "@/lib/seo";

import { PidSimulator } from "./_components/PidSimulator";

export const metadata: Metadata = buildPageMetadata({
  title: PID_CONTROLLER_PAGE_TITLE,
  description: PID_CONTROLLER_DESCRIPTION,
  path: PID_CONTROLLER_PATH,
});

export default function PidControllerPage() {
  return (
    <>
      <JsonLdBreadcrumbs
        items={[
          { name: "Home", item: "/" },
          { name: PID_CONTROLLER_TITLE, item: PID_CONTROLLER_PATH },
        ]}
      />
      <JsonLd<WebPage>
        item={buildWebPageSchema({
          path: PID_CONTROLLER_PATH,
          title: PID_CONTROLLER_PAGE_TITLE,
          description: PID_CONTROLLER_DESCRIPTION,
        })}
      />
      <PageShell
        title={PID_CONTROLLER_TITLE}
        titleId="pid-controller"
        description="Choose a plant, tune the gains, and watch it respond."
      >
        <ResponsiveContainer>
          <PidSimulator />
        </ResponsiveContainer>
      </PageShell>
    </>
  );
}
