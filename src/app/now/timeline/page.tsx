import { JsonLd } from "react-schemaorg";

import { Metadata } from "next";
import Link from "next/link";

import { CollectionPage } from "schema-dts";

import { NowSnapshotContent } from "@/app/now/_components/NowSnapshotContent";
import { Badge } from "@/components/Badge";
import { JsonLdBreadcrumbs } from "@/components/JsonLdBreadcrumbs";
import { PageShell } from "@/components/PageShell";
import { ProseContent } from "@/components/ProseContent";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { Surface } from "@/components/Surface";
import {
  formatNowSnapshotDate,
  NOW_PAGE_LAST_UPDATED_ISO,
  nowSnapshots,
} from "@/lib/nowTimeline";
import { buildCollectionPageSchema, buildPageMetadata } from "@/lib/seo";

const title = "Now Archive | Alex Leung";
const description = "An archive of past Now page snapshots from Alex Leung.";
const path = "/now/timeline";

export const metadata: Metadata = buildPageMetadata({
  title,
  description,
  path,
});

export default function NowTimelinePage() {
  return (
    <>
      <JsonLdBreadcrumbs
        items={[
          { name: "Home", item: "/" },
          { name: "Now", item: "/now" },
          { name: "Timeline", item: path },
        ]}
      />
      <JsonLd<CollectionPage>
        item={buildCollectionPageSchema({
          path,
          title,
          description,
        })}
      />

      <PageShell title="Now Archive" titleId="now-archive">
        <ResponsiveContainer className="space-y-8">
          <ProseContent size="sm" className="text-gray-300">
            <p>
              A small archive of what the Now page has said at different points.
              It keeps a record of what had my attention as work, reading, and
              life moved around.
            </p>
          </ProseContent>

          <ol className="space-y-4">
            {nowSnapshots.map((snapshot, index) => (
              <li key={snapshot.id}>
                <Surface className="p-5 md:p-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h2 className="text-heading-sm text-white">
                        {formatNowSnapshotDate(snapshot.date)}
                      </h2>
                      {snapshot.summary ? (
                        <p className="text-body-sm mt-2 text-gray-300">
                          {snapshot.summary}
                        </p>
                      ) : null}
                    </div>
                    {index === 0 ? <Badge>Current</Badge> : null}
                  </div>
                  <NowSnapshotContent
                    snapshot={snapshot}
                    compact
                    headingLevel="h3"
                    className="mt-5 text-gray-200"
                  />
                </Surface>
              </li>
            ))}
          </ol>

          <Link
            href="/now/"
            className="text-body inline-flex font-semibold text-accent-link transition-colors hover:text-accent-link-hover"
          >
            Back to current Now page
          </Link>
        </ResponsiveContainer>
      </PageShell>
    </>
  );
}

export const NOW_TIMELINE_LAST_UPDATED_ISO = NOW_PAGE_LAST_UPDATED_ISO;
