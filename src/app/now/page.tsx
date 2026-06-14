import { JsonLd } from "react-schemaorg";

import { Metadata } from "next";

import { WebPage } from "schema-dts";

import { Badge } from "@/components/Badge";
import ExternalLink from "@/components/ExternalLink";
import { IconTextRow } from "@/components/IconTextRow";
import { JsonLdBreadcrumbs } from "@/components/JsonLdBreadcrumbs";
import { LatestWritingSection } from "@/components/LatestWritingSection";
import { PageShell } from "@/components/PageShell";
import { ProseContent } from "@/components/ProseContent";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { SectionBlock } from "@/components/SectionBlock";
import { getAllPosts } from "@/lib/blogApi";
import { buildPageMetadata, buildWebPageSchema } from "@/lib/seo";

export const NOW_PAGE_LAST_UPDATED_ISO = "2026-05-01";

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
        <div className="mb-8 text-center">
          <Badge tone="info">
            Last updated: {NOW_PAGE_LAST_UPDATED_DISPLAY}
          </Badge>
        </div>

        <ResponsiveContainer element="section">
          <SectionBlock spacing="lg">
            <div className="text-body space-y-8 text-left leading-relaxed">
              <IconTextRow icon="🚀" title="Top of Mind" headingLevel="h2">
                <p>
                  I&apos;m spending most of my time getting settled into my new
                  role at{" "}
                  <ExternalLink href="https://openai.com/">OpenAI</ExternalLink>
                  .
                </p>
                <p>
                  Outside of that, I&apos;m still finding my rhythm in San
                  Francisco after the recent move. Most of my attention is on
                  building context at work, getting the rest of life into a
                  steadier shape, and waiting for my possessions to arrive.
                  I&apos;m hoping everything can be delivered and unloaded by
                  Thursday, May 7.
                </p>
              </IconTextRow>

              <IconTextRow
                icon="📚"
                title="Currently Reading"
                headingLevel="h2"
              >
                <p>
                  I&apos;m currently on Chapter 9 of{" "}
                  <ExternalLink href="https://www.deeplearningbook.org/">
                    <em>Deep Learning</em>
                  </ExternalLink>{" "}
                  by Goodfellow, Bengio, and Courville.
                </p>
                <p>
                  I finished <em>Children of Time</em> and absolutely loved it.
                  I want to pick up the next book once I have a bit more time.
                </p>
                <p>
                  <ExternalLink href="https://www.domainlanguage.com/ddd/">
                    <em>Domain Driven Design</em>
                  </ExternalLink>{" "}
                  is on hold while I work through Deep Learning.
                </p>
              </IconTextRow>

              <IconTextRow icon="🎯" title="Current Goals" headingLevel="h2">
                <ul className="list-outside list-disc space-y-1 pl-6">
                  <li>Finish the Deep Learning book and write notes as I go</li>
                  <li>Build context in my new role</li>
                  <li>Get settled in San Francisco</li>
                  <li>Keep improving at tennis</li>
                  <li>Get to A2 proficiency in Chinese</li>
                </ul>
              </IconTextRow>

              <IconTextRow icon="🎬" title="Recently Watched" headingLevel="h2">
                <p>
                  I watched <em>Project Hail Mary</em> and really liked it.
                </p>
                <p>
                  The movie was a good time, but I still enjoyed the detail and
                  depth of the book more.
                </p>
              </IconTextRow>
            </div>

            <ProseContent
              size="sm"
              className="mt-8 border-t border-gray-700 pt-8"
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
