import type { ReactNode } from "react";

import Link from "next/link";

import ExternalLink from "@/components/ExternalLink";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { ResponsiveImage } from "@/components/ResponsiveImage";
import { SectionBlock } from "@/components/SectionBlock";
import {
  getStaticImageFallback,
  getStaticImageSourceSet,
} from "@/lib/localImageMetadata";

type AboutNoteProps = {
  title: string;
  children: ReactNode;
};

function AboutNote({ title, children }: AboutNoteProps) {
  return (
    <section className="space-y-3">
      <h3 className="text-heading-sm font-semibold text-white">{title}</h3>
      <div className="space-y-3 leading-relaxed text-gray-200">{children}</div>
    </section>
  );
}

export function Journey() {
  const aboutPortraitSrcSet = getStaticImageSourceSet("aboutPortrait");
  const aboutPortraitFallback = getStaticImageFallback("aboutPortrait");

  return (
    <ResponsiveContainer element="section">
      <SectionBlock title="Background" titleId="background" spacing="lg">
        <div className="md:grid md:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] md:items-start md:gap-x-16 md:pt-8">
          <div className="text-body mb-8 space-y-7 text-left">
            <AboutNote title="Current Work">
              <p>
                Hi, I&apos;m Alex. I&apos;m a software engineer in San
                Francisco, currently working at{" "}
                <ExternalLink href="https://openai.com/">OpenAI</ExternalLink>.
              </p>
              <p>
                I keep a short{" "}
                <Link
                  href="/now/"
                  className="text-accent-link transition-colors hover:text-accent-link-hover"
                >
                  Now page
                </Link>{" "}
                for the things I&apos;m focused on right now.
              </p>
            </AboutNote>

            <AboutNote title="Previous Work">
              <p>
                Before OpenAI, I worked on home electrification at{" "}
                <ExternalLink href="https://jetsonhome.com">
                  Jetson
                </ExternalLink>
                , AR/AI glasses at{" "}
                <ExternalLink href="https://arvr.google.com/">
                  Google
                </ExternalLink>
                , and consumer finance at{" "}
                <ExternalLink href="https://cash.app/">Cash App</ExternalLink>.
              </p>
              <p>
                That work has crossed embedded systems, distributed systems,
                backend infrastructure, and full-stack product surfaces.
              </p>
            </AboutNote>

            <AboutNote title="How I Work">
              <p>
                I usually work near the boundary between product behavior and
                the systems underneath it: turning rough ideas into usable
                flows, keeping state understandable, and making the reliable
                path feel simple.
              </p>
              <p>
                I&apos;m especially interested in AI product development:
                shaping useful behavior, evaluating agent workflows, and keeping
                careful review in the loop.
              </p>
            </AboutNote>

            <AboutNote title="Writing">
              <p>
                I share my thoughts on software, AI tools, deep learning, and
                small browser-based tools here. For a better sense of how I
                think, start with my{" "}
                <Link
                  href="/blog/"
                  className="text-accent-link transition-colors hover:text-accent-link-hover"
                >
                  recent writing
                </Link>{" "}
                or{" "}
                <Link
                  href="/contact/"
                  className="text-accent-link transition-colors hover:text-accent-link-hover"
                >
                  get in touch here
                </Link>
                .
              </p>
              <p>
                Away from the desk, I spend time reading, playing tennis,
                hiking, climbing, and hanging out with my cats.
              </p>
            </AboutNote>
          </div>

          <div className="md:sticky md:top-[calc(var(--header-height)+2rem)]">
            <ResponsiveImage
              src={aboutPortraitFallback.path}
              srcSet={aboutPortraitSrcSet}
              alt="Alex Leung sitting on a mountain trail during a hiking adventure"
              width={aboutPortraitFallback.width}
              height={aboutPortraitFallback.height}
              sizes="(min-width: 1024px) 28vw, (min-width: 768px) 36vw, 88vw"
              className="aspect-[4/3] w-full rounded-lg border border-white/10 object-cover"
              loading="lazy"
              fetchPriority="low"
              decoding="async"
            />
          </div>
        </div>
      </SectionBlock>
    </ResponsiveContainer>
  );
}
