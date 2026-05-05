import { JsonLd } from "react-schemaorg";

import { Metadata } from "next";
import Link from "next/link";

import { WebPage } from "schema-dts";

import { Badge } from "@/components/Badge";
import ExternalLink from "@/components/ExternalLink";
import { JsonLdBreadcrumbs } from "@/components/JsonLdBreadcrumbs";
import { LatestWritingSection } from "@/components/LatestWritingSection";
import { PageShell } from "@/components/PageShell";
import { ProseContent } from "@/components/ProseContent";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { SectionBlock } from "@/components/SectionBlock";
import { getAllPosts } from "@/lib/blogApi";
import {
  formatNowSnapshotDate,
  latestNowSnapshot,
  NOW_PAGE_LAST_UPDATED_ISO,
} from "@/lib/nowTimeline";
import { buildPageMetadata, buildWebPageSchema } from "@/lib/seo";

import { NowSnapshotContent } from "./_components/NowSnapshotContent";

export { NOW_PAGE_LAST_UPDATED_ISO };

export const NOW_PAGE_LAST_UPDATED_DISPLAY = formatNowSnapshotDate(
  NOW_PAGE_LAST_UPDATED_ISO
);

const title = "Now | Alex Leung";
const description =
  "Current notes from Alex Leung on what he is reading, working through, and paying attention to.";
const path = "/now";

export const metadata: Metadata = buildPageMetadata({
  title,
  description,
  path,
});

export default function NowPage() {
  const latestPosts = getAllPosts(["slug", "title", "date", "excerpt"]).slice(
    0,
    3
  );

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
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Badge tone="info">
            Last updated: {NOW_PAGE_LAST_UPDATED_DISPLAY}
          </Badge>
          <Link
            href="/now/timeline/"
            className="text-body-sm font-semibold text-accent-link transition-colors hover:text-accent-link-hover"
          >
            Past Now Pages
          </Link>
        </div>

        <ResponsiveContainer element="section">
          <SectionBlock spacing="lg">
            <NowSnapshotContent snapshot={latestNowSnapshot} />

            <ProseContent size="sm" className="border-t border-gray-700 pt-8">
              <p>
                This is a{" "}
                <ExternalLink href="https://nownownow.com/about">
                  now page
                </ExternalLink>
                . You can read more about the format{" "}
                <ExternalLink href="https://sive.rs/nowff">
                  in Derek Sivers&apos; now page explainer
                </ExternalLink>
                . It&apos;s a snapshot of what I&apos;m focused on at this point
                in my life.
              </p>
            </ProseContent>
          </SectionBlock>
        </ResponsiveContainer>
      </PageShell>
      <LatestWritingSection posts={latestPosts} />
    </>
  );
}
