import { HiOutlineArrowRight } from "react-icons/hi";
import { JsonLd } from "react-schemaorg";

import { Metadata } from "next";
import Link from "next/link";

import type { WebPage } from "schema-dts";

import { Hero } from "@/components/Hero";
import { LatestWritingSection } from "@/components/LatestWritingSection";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { SectionBlock } from "@/components/SectionBlock";
import { Surface } from "@/components/Surface";
import { EXPERIMENTS } from "@/constants/experiments";
import { getAllPosts } from "@/lib/blogApi";
import { buildHomePageSchema, buildPageMetadata } from "@/lib/seo";

const title = "Alex Leung | Software Engineer and Writer";
const description =
  "Alex Leung is a software engineer and writer in San Francisco covering AI product development, software systems, deep learning notes, and open experiments.";
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
      alt: "Portrait of Alex Leung",
    },
  ],
});

const featuredExperiments = EXPERIMENTS.slice(0, 3);

function OpenExperimentsSection() {
  return (
    <ResponsiveContainer element="section" className="pb-12 md:pb-14">
      <SectionBlock
        title="Open Experiments"
        titleId="open-experiments"
        spacing="lg"
      >
        <div className="grid gap-4 md:grid-cols-3">
          {featuredExperiments.map((experiment) => (
            <Link
              key={experiment.id}
              href={experiment.path}
              className="group block h-full"
            >
              <Surface
                className="flex h-full flex-col justify-between p-4 md:p-5"
                interactive
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-accent-secondary-soft">
                    {experiment.kind}
                  </p>
                  <h3 className="text-heading-sm mt-3 font-semibold text-white transition-colors group-hover:text-accent-link">
                    {experiment.pageTitle}
                  </h3>
                  <p className="text-body-sm mt-3 text-gray-300">
                    {experiment.description}
                  </p>
                </div>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent-link transition-colors group-hover:text-accent-link-hover">
                  Open experiment
                  <HiOutlineArrowRight aria-hidden="true" className="text-lg" />
                </span>
              </Surface>
            </Link>
          ))}
        </div>
        <div>
          <Link
            href="/experimental/"
            className="text-body -ml-3 inline-flex min-h-11 items-center gap-2 rounded-md px-3 font-semibold text-accent-link transition-colors hover:text-accent-link-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-link focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            See all experiments
            <HiOutlineArrowRight aria-hidden="true" className="text-lg" />
          </Link>
        </div>
      </SectionBlock>
    </ResponsiveContainer>
  );
}

export default function Page() {
  const latestPosts = getAllPosts(["slug", "title", "date", "excerpt"]).slice(
    0,
    3
  );

  return (
    <>
      <JsonLd<WebPage>
        item={buildHomePageSchema({
          path,
          title,
          description,
        })}
      />
      <Hero />
      <LatestWritingSection posts={latestPosts} />
      <OpenExperimentsSection />
    </>
  );
}
