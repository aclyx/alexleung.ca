import { JsonLd } from "react-schemaorg";

import { Metadata } from "next";

import { WebPage } from "schema-dts";

import ExternalLink from "@/components/ExternalLink";
import { JsonLdBreadcrumbs } from "@/components/JsonLdBreadcrumbs";
import { NowEntry } from "@/components/NowEntry";
import { PageShell } from "@/components/PageShell";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { NOW_CONTENT, NOW_PAGE_LAST_UPDATED_DISPLAY } from "@/constants/now";
import { buildPageMetadata, buildWebPageSchema } from "@/lib/seo";

const title = "Now | Alex Leung";
const description =
  "Current notes from Alex Leung on reading and everyday life.";
const path = "/now";

export const metadata: Metadata = buildPageMetadata({
  title,
  description,
  path,
});

export default function NowPage() {
  return (
    <>
      <JsonLdBreadcrumbs
        items={[
          { name: "Home", item: "/" },
          { name: "Now", item: "/now" },
        ]}
      />
      <JsonLd<WebPage>
        item={buildWebPageSchema({
          path,
          title,
          description,
        })}
      />

      <PageShell
        title="Now"
        titleId="now"
        metadata={
          <time dateTime={NOW_CONTENT.updatedAt} className="font-mono text-xs">
            Updated {NOW_PAGE_LAST_UPDATED_DISPLAY}
          </time>
        }
      >
        <ResponsiveContainer>
          <div className="max-w-[650px]">
            <div className="text-body space-y-8 leading-relaxed">
              {NOW_CONTENT.entries.map((entry) => (
                <NowEntry key={entry.id} entry={entry} />
              ))}
            </div>
            <p className="text-body-sm mt-9 border-t border-line pt-5 text-muted">
              A snapshot of what I’m reading and doing.{" "}
              <ExternalLink href="https://nownownow.com/about">
                About Now pages
              </ExternalLink>
            </p>
          </div>
        </ResponsiveContainer>
      </PageShell>
    </>
  );
}
