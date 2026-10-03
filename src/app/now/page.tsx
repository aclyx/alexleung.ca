import { JsonLd } from "react-schemaorg";

import { Metadata } from "next";

import { WebPage } from "schema-dts";

import { Badge } from "@/components/Badge";
import ExternalLink from "@/components/ExternalLink";
import { IconTextRow } from "@/components/IconTextRow";
import { JsonLdBreadcrumbs } from "@/components/JsonLdBreadcrumbs";
import { PageShell } from "@/components/PageShell";
import { ProseContent } from "@/components/ProseContent";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { SectionBlock } from "@/components/SectionBlock";
import { buildPageMetadata, buildWebPageSchema } from "@/lib/seo";

export const NOW_PAGE_LAST_UPDATED_ISO = "2026-10-03";

const nowPageLastUpdatedDate = new Date(
  `${NOW_PAGE_LAST_UPDATED_ISO}T00:00:00Z`
);

export const NOW_PAGE_LAST_UPDATED_DISPLAY = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
}).format(nowPageLastUpdatedDate);

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

      <PageShell title="What I'm Doing Now" titleId="now">
        <ResponsiveContainer className="mb-10">
          <Badge tone="info">
            Last updated: {NOW_PAGE_LAST_UPDATED_DISPLAY}
          </Badge>
        </ResponsiveContainer>

        <ResponsiveContainer element="section">
          <div className="max-w-3xl">
            <SectionBlock spacing="lg">
              <div className="text-body space-y-8 text-left leading-relaxed">
                <IconTextRow
                  icon="📚"
                  title="Currently Reading"
                  headingLevel="h2"
                >
                  <p>
                    I&apos;m reading{" "}
                    <ExternalLink href="https://rlhfbook.com/">
                      <em>Reinforcement Learning from Human Feedback</em>
                    </ExternalLink>{" "}
                    by Nathan Lambert.
                  </p>
                </IconTextRow>

                <IconTextRow
                  icon="🍶"
                  title="Trying New Sake"
                  headingLevel="h2"
                >
                  <p>
                    We&apos;ve been enjoying trying new sake. We recently tried
                    an unpasteurized sake, and I particularly liked its
                    effervescence and brighter aroma.
                  </p>
                </IconTextRow>
              </div>

              <ProseContent
                size="sm"
                className="mt-8 border-t border-line pt-8"
              >
                <p>
                  This is a{" "}
                  <ExternalLink href="https://nownownow.com/about">
                    now page
                  </ExternalLink>
                  . You can read more about the format{" "}
                  <ExternalLink href="https://sive.rs/nowff">
                    in Derek Sivers&apos; now page explainer
                  </ExternalLink>
                  . It&apos;s a snapshot of what I&apos;m focused on at this
                  point in my life.
                </p>
              </ProseContent>
            </SectionBlock>
          </div>
        </ResponsiveContainer>
      </PageShell>
    </>
  );
}
