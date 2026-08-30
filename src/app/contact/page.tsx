import { JsonLd } from "react-schemaorg";

import { Metadata } from "next";

import * as schemadts from "schema-dts";

import { FollowItSubscribeForm } from "@/components/FollowItSubscribeForm";
import { JsonLdBreadcrumbs } from "@/components/JsonLdBreadcrumbs";
import { PageShell } from "@/components/PageShell";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { Subtitle } from "@/components/Subtitle";
import { buildContactPageSchema, buildPageMetadata } from "@/lib/seo";

import { EmailMe } from "./_components/EmailMe";
import { SocialMediaList } from "./_components/SocialMediaList";

const title = "Contact | Alex Leung";
const description = "Ways to reach Alex Leung and follow new writing.";
const path = "/contact";

export const metadata: Metadata = buildPageMetadata({
  title,
  description,
  path,
});

export default function ContactPage() {
  return (
    <>
      <JsonLdBreadcrumbs
        items={[
          { name: "Home", item: "/" },
          { name: "Contact", item: "/contact" },
        ]}
      />
      <JsonLd<schemadts.ContactPage>
        item={buildContactPageSchema({
          path,
          title,
          description,
        })}
      />

      <PageShell title="Contact" titleId="contact">
        <EmailMe />
        <SocialMediaList />
        <ResponsiveContainer element="section" className="mt-16 space-y-6">
          <Subtitle title="Subscribe" id="subscribe" />
          <FollowItSubscribeForm
            analyticsPlacement="contact_page"
            title="Get new posts by email"
            description="Occasional updates when I publish something new."
          />
        </ResponsiveContainer>
      </PageShell>
    </>
  );
}
