import Link from "next/link";

import ExternalLink from "@/components/ExternalLink";
import { IconTextRow } from "@/components/IconTextRow";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { ResponsiveImage } from "@/components/ResponsiveImage";
import { SectionBlock } from "@/components/SectionBlock";
import {
  getStaticImageFallback,
  getStaticImageSourceSet,
} from "@/lib/localImageMetadata";

export function Journey() {
  const aboutPortraitSrcSet = getStaticImageSourceSet("aboutPortrait");
  const aboutPortraitFallback = getStaticImageFallback("aboutPortrait");

  return (
    <ResponsiveContainer element="section">
      <SectionBlock title="Background" titleId="background" spacing="lg">
        <div className="md:grid md:grid-cols-[3fr_2fr] md:gap-x-16 md:pt-8">
          <div className="text-body mb-8 space-y-6 text-left">
            <IconTextRow icon="👋" title="Currently">
              <p>
                Hi, I&apos;m Alex, a software engineer based in San Francisco. I
                work at{" "}
                <ExternalLink href="https://openai.com/">OpenAI</ExternalLink>.
              </p>
              <p>
                For a more current snapshot of what I&apos;m focused on, I keep
                a short{" "}
                <Link
                  href="/now/"
                  className="text-accent-link transition-colors hover:text-accent-link-hover"
                >
                  Now page
                </Link>
                .
              </p>
              <p>
                My background spans embedded systems, distributed systems, and
                full-stack product engineering, with previous work across home
                electrification at{" "}
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
            </IconTextRow>

            <IconTextRow icon="🛠️" title="Building Style">
              <p>
                I&apos;m drawn to software products and systems that feel simple
                to use.
              </p>
              <p>
                That often means working across boundaries: product definition,
                backend systems, data flows, infrastructure, frontend surfaces,
                and the engineering details that make the experience reliable.
              </p>
            </IconTextRow>

            <IconTextRow icon="🧩" title="Problem Shape">
              <p>
                I&apos;m especially interested in problems where the shape is
                still being figured out: early ideas, product inflection points,
                and systems that need to grow without becoming harder to reason
                about.
              </p>
              <p>
                Lately, I&apos;ve been especially interested in AI product
                development: shaping useful product behavior, evaluating agent
                workflows, and keeping careful review in the loop.
              </p>
              <p>
                I&apos;m usually happiest in work where there are several
                plausible paths forward, and progress depends on taste,
                iteration, and good feedback.
              </p>
            </IconTextRow>

            <IconTextRow icon="✍️" title="Writing and Outside Work">
              <p>
                I write notes on software, AI tools, and learning from small
                projects. If you want a better sense of how I think, start with
                my{" "}
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
                Outside of work, I spend time playing tennis, reading, hiking,
                rock climbing, and spending time with my cats.
              </p>
            </IconTextRow>
          </div>

          <div className="flex flex-col gap-4 md:gap-6">
            <ResponsiveImage
              src={aboutPortraitFallback.path}
              srcSet={aboutPortraitSrcSet}
              alt="Alex Leung sitting on a mountain trail during a hiking adventure"
              width={aboutPortraitFallback.width}
              height={aboutPortraitFallback.height}
              sizes="(min-width: 1024px) 28vw, (min-width: 768px) 36vw, 88vw"
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
