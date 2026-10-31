import { JsonLd } from "react-schemaorg";

import { Metadata } from "next";

import * as schemadts from "schema-dts";

import { FollowItSubscribeForm } from "@/components/FollowItSubscribeForm";
import { JsonLdBreadcrumbs } from "@/components/JsonLdBreadcrumbs";
import { PageShell } from "@/components/PageShell";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { buildContactPageSchema, buildPageMetadata } from "@/lib/seo";

import { EmailMe } from "./_components/EmailMe";
import { SocialMediaList } from "./_components/SocialMediaList";

const title = "Contact | Alex Leung";
const description =
  "Email Alex Leung about a software project or something he wrote, or follow new writing by email or RSS.";
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
        <ResponsiveContainer>
          <div className="max-w-[650px]">
            <EmailMe />
            <SocialMediaList />
            <FollowItSubscribeForm
              analyticsPlacement="contact_page"
              className="mt-6"
            />
          </div>
        </ResponsiveContainer>
      </PageShell>
    </>
  );
}
