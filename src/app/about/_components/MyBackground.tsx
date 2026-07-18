import type { ReactNode } from "react";

import ExternalLink from "@/components/ExternalLink";
import { LinkText } from "@/components/LinkText";
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
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] md:items-start md:gap-x-16 md:pt-8">
          <div className="text-body order-2 space-y-7 text-left md:order-1">
            <AboutNote title="Current Work">
              <p>
                Hi, I&apos;m Alex. I&apos;m a software engineer in San
                Francisco, currently working at{" "}
                <ExternalLink href="https://openai.com/">OpenAI</ExternalLink>.
              </p>
              <p>
                I keep a short <LinkText href="/now/">Now page</LinkText>, with
                notes on what I&apos;m focused on right now.
              </p>
            </AboutNote>

            <AboutNote title="How I Work">
              <p>
                I often work on projects where the product and system boundaries
                are still moving. I make the constraints and failure modes
                explicit, help choose a direction, and work through the
                implementation with the team.
              </p>
              <p>
                Along the way, I write down decisions, clarify interfaces, and
                build tools that make the system easier to change.
              </p>
            </AboutNote>

            <AboutNote title="Writing">
              <p>
                I write about software systems, AI tools, deep learning, and
                personal experiments here. For a better sense of how I think
                through technical work, start with my{" "}
                <LinkText href="/blog/">recent writing</LinkText>, or{" "}
                <LinkText href="/contact/">get in touch here</LinkText>.
              </p>
              <p>
                Away from the desk, I spend time reading, playing tennis,
                hiking, climbing, and hanging out with my cats.
              </p>
            </AboutNote>
          </div>

          <div className="order-1 md:sticky md:top-[calc(var(--header-height)+2rem)] md:order-2">
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
