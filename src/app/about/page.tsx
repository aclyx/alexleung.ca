import { JsonLd } from "react-schemaorg";

import { Metadata } from "next";

import * as schemadts from "schema-dts";

import { Credentials } from "@/app/about/_components/Credentials";
import { Journey } from "@/app/about/_components/MyBackground";
import { JsonLdBreadcrumbs } from "@/components/JsonLdBreadcrumbs";
import { LatestWritingSection } from "@/components/LatestWritingSection";
import { PageShell } from "@/components/PageShell";
import { getAllPosts } from "@/lib/blogApi";
import { buildPageMetadata, buildProfilePageSchema } from "@/lib/seo";

import { Interests } from "./_components/Interests";
import { PersonalPhotos } from "./_components/PersonalPhotos";

const title = "About Alex Leung | San Francisco Software Engineer";
const description =
  "Alex Leung is a San Francisco software engineer with experience across embedded systems, distributed systems, product engineering, and AI product development.";
const path = "/about";

export const metadata: Metadata = buildPageMetadata({
  title,
  description,
  path,
  images: [
    {
      url: "/assets/about_portrait.webp",
      width: 5712,
      height: 4284,
      alt: "Alex Leung sitting on a mountain trail during a hiking adventure",
    },
  ],
});

export default function AboutPage() {
  const latestPosts = getAllPosts(["slug", "title", "date", "excerpt"]).slice(
    0,
    3
  );

  return (
    <>
      <JsonLdBreadcrumbs
        items={[
          { name: "Home", item: "/" },
          { name: "About", item: "/about" },
        ]}
      />
      <JsonLd<schemadts.ProfilePage>
        item={buildProfilePageSchema({
          path,
          title,
          description,
        })}
      />

      <PageShell title="About" titleId="about">
        <div className="space-y-12 md:space-y-14">
          <Journey />
          <PersonalPhotos />
          <Interests />
          <Credentials />
        </div>
      </PageShell>
      <LatestWritingSection posts={latestPosts} />
    </>
  );
}
