import { JsonLd } from "react-schemaorg";

import { Metadata } from "next";

import type { ProfilePage } from "schema-dts";

import ExternalLink from "@/components/ExternalLink";
import { Hero } from "@/components/Hero";
import { HomeSectionAnalytics } from "@/components/HomeSectionAnalytics";
import { LatestWritingSection } from "@/components/LatestWritingSection";
import { LinkText } from "@/components/LinkText";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { SectionHeading } from "@/components/SectionHeading";
import { getAllPosts } from "@/lib/blogApi";
import { buildPageMetadata, buildProfilePageSchema } from "@/lib/seo";

const title = "Alex Leung | Software Engineer and Writer";
const description =
  "Alex Leung is a software engineer and writer in San Francisco. He writes about software, technical books, and life outside work.";
const path = "/";

export const metadata: Metadata = buildPageMetadata({
  title,
  description,
  path,
  images: [
    {
      url: "/assets/alex_vibing.webp",
      width: 1536,
      height: 1024,
      alt: "Alex Leung in an art studio",
    },
  ],
});

export default function Page() {
  const latestPosts = getAllPosts([
    "slug",
    "title",
    "date",
    "excerpt",
    "tags",
  ]).slice(0, 3);

  return (
    <>
      <JsonLd<ProfilePage>
        item={buildProfilePageSchema({
          path,
          title,
          description,
        })}
      />
      <HomeSectionAnalytics />
      <Hero />

      <ResponsiveContainer
        element="section"
        className="border-t border-line py-16 md:py-24"
      >
        <div
          id="experience"
          className="grid gap-8 md:grid-cols-[15rem_minmax(0,1fr)]"
        >
          <div>
            <SectionHeading eyebrow="Work and study" title="Experience" />
          </div>

          <div>
            <div className="border-b border-line">
              <article className="experience-entry grid gap-3 md:grid-cols-[10rem_minmax(0,1fr)] md:gap-7">
                <div>
                  <h3 className="text-lg font-semibold text-ink">
                    <ExternalLink href="https://openai.com/">
                      OpenAI
                    </ExternalLink>
                  </h3>
                  <p className="mt-1 text-sm text-muted">AI products</p>
                </div>
                <p className="leading-relaxed text-muted">
                  Building ChatGPT products and systems that bring model
                  capabilities into everyday use.
                </p>
              </article>

              <article className="experience-entry grid gap-3 md:grid-cols-[10rem_minmax(0,1fr)] md:gap-7">
                <div>
                  <h3 className="text-lg font-semibold text-ink">
                    <ExternalLink href="https://jetsonhome.com/">
                      Jetson
                    </ExternalLink>
                  </h3>
                  <p className="mt-1 text-sm text-muted">
                    Home electrification
                  </p>
                </div>
                <p className="leading-relaxed text-muted">
                  Built products and systems to make home electrification easier
                  across North America.
                </p>
              </article>

              <article className="experience-entry grid gap-3 md:grid-cols-[10rem_minmax(0,1fr)] md:gap-7">
                <div>
                  <h3 className="text-lg font-semibold text-ink">
                    <ExternalLink href="https://arvr.google.com/">
                      Google
                    </ExternalLink>
                  </h3>
                  <p className="mt-1 text-sm text-muted">AR and AI glasses</p>
                </div>
                <p className="leading-relaxed text-muted">
                  Built the platform that powered Google&apos;s AR glasses.
                </p>
              </article>

              <article className="experience-entry grid gap-3 md:grid-cols-[10rem_minmax(0,1fr)] md:gap-7">
                <div>
                  <h3 className="text-lg font-semibold text-ink">
                    <ExternalLink href="https://cash.app/">
                      Cash App
                    </ExternalLink>
                  </h3>
                  <p className="mt-1 text-sm text-muted">Consumer finance</p>
                </div>
                <p className="leading-relaxed text-muted">
                  Built products and systems used by millions of customers to
                  move and manage their money.
                </p>
              </article>

              <article className="experience-entry grid gap-3 md:grid-cols-[10rem_minmax(0,1fr)] md:gap-7">
                <div>
                  <h3 className="text-lg font-semibold text-ink">North</h3>
                  <p className="mt-1 text-sm text-muted">
                    Consumer smartglasses
                  </p>
                </div>
                <p className="leading-relaxed text-muted">
                  Built the world&apos;s first display-integrated consumer
                  smartglasses.
                </p>
              </article>
            </div>

            <div className="grid gap-5 pt-8 text-sm md:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="font-semibold text-ink">P.Eng.</p>
                <p className="mt-1 leading-relaxed text-muted">
                  Professional Engineers{" "}
                  <span className="whitespace-nowrap">
                    Ontario · Since 2017
                  </span>
                </p>
              </div>
              <div>
                <p className="font-semibold text-ink">Georgia Tech</p>
                <p className="mt-1 leading-relaxed text-muted">
                  MSECE, Electrical &amp; Computer{" "}
                  <span className="whitespace-nowrap">
                    Engineering · 2013–2016
                  </span>
                </p>
              </div>
              <div>
                <p className="font-semibold text-ink">Waterloo</p>
                <p className="mt-1 leading-relaxed text-muted">
                  BASc, Electrical Engineering &amp; Pure{" "}
                  <span className="whitespace-nowrap">
                    Mathematics · 2008–2013
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </ResponsiveContainer>

      <ResponsiveContainer
        element="section"
        className="border-t border-line py-16 md:py-24"
      >
        <div
          id="interests"
          className="grid items-start gap-8 md:grid-cols-[15rem_minmax(0,1fr)]"
        >
          <div>
            <SectionHeading eyebrow="Outside work" title="Interests" />
          </div>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-12">
            <div className="max-w-2xl text-lg leading-relaxed text-muted">
              <p>
                I spend time reading, playing tennis, hiking, climbing, and
                hanging out with my cats. I write about technical books and life
                outside work alongside my software notes.
              </p>
              <p className="mt-5">
                My <LinkText href="/now/">Now page</LinkText>
                {" is a short, current note on what I'm reading and studying."}
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-x-5 gap-y-5 border-t border-line pt-5 text-sm lg:grid-cols-1 lg:border-t-0 lg:pt-0">
              <div>
                <dt className="font-semibold text-ink">Reading</dt>
                <dd className="mt-1 text-muted">Technology and history</dd>
              </div>
              <div>
                <dt className="font-semibold text-ink">Outdoors</dt>
                <dd className="mt-1 text-muted">Hiking and climbing</dd>
              </div>
              <div>
                <dt className="font-semibold text-ink">Sport</dt>
                <dd className="mt-1 text-muted">Tennis</dd>
              </div>
              <div>
                <dt className="font-semibold text-ink">Home</dt>
                <dd className="mt-1 text-muted">Two cats</dd>
              </div>
            </dl>
          </div>
        </div>
      </ResponsiveContainer>

      <LatestWritingSection posts={latestPosts} />

      <ResponsiveContainer
        element="section"
        className="border-t border-line py-16 md:py-24"
      >
        <div className="max-w-2xl">
          <SectionHeading eyebrow="Contact" title="Say hello" />
          <p className="mt-5 text-lg leading-relaxed text-muted">
            The <LinkText href="/contact/">contact page</LinkText> has the best
            ways to reach me and follow new writing.
          </p>
        </div>
      </ResponsiveContainer>
    </>
  );
}
