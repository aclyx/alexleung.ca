import { JsonLd } from "react-schemaorg";

import { Metadata } from "next";

import { WebPage } from "schema-dts";

import { JsonLdBreadcrumbs } from "@/components/JsonLdBreadcrumbs";
import { PageShell } from "@/components/PageShell";
import {
  MANDELBROT_DESCRIPTION,
  MANDELBROT_PAGE_TITLE,
  MANDELBROT_PATH,
  MANDELBROT_TITLE,
} from "@/constants/mandelbrot";
import { buildPageMetadata, buildWebPageSchema } from "@/lib/seo";

import { MandelbrotExplorer } from "./_components/MandelbrotExplorer";

export const metadata: Metadata = buildPageMetadata({
  title: MANDELBROT_PAGE_TITLE,
  description: MANDELBROT_DESCRIPTION,
  path: MANDELBROT_PATH,
});

export default function MandelbrotPage() {
  return (
    <>
      <JsonLdBreadcrumbs
        items={[
          { name: "Home", item: "/" },
          { name: MANDELBROT_TITLE, item: MANDELBROT_PATH },
        ]}
      />
      <JsonLd<WebPage>
        item={buildWebPageSchema({
          path: MANDELBROT_PATH,
          title: MANDELBROT_PAGE_TITLE,
          description: MANDELBROT_DESCRIPTION,
        })}
      />

      <PageShell title={MANDELBROT_TITLE} titleId="mandelbrot-explorer">
        <MandelbrotExplorer />
      </PageShell>
    </>
  );
}
