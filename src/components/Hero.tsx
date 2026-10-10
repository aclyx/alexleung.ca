import { LinkText } from "@/components/LinkText";
import { NowEntry } from "@/components/NowEntry";
import {
  NOW_CONTENT,
  NOW_PAGE_LAST_UPDATED_DISPLAY,
  NOW_PAGE_LAST_UPDATED_ISO,
} from "@/constants/now";

export function Hero() {
  return (
    <section id="about" aria-labelledby="home-title" className="section-center">
      <div className="grid gap-7 border-b border-line py-8 md:grid-cols-[minmax(0,1.45fr)_minmax(0,0.85fr)] md:gap-16 md:py-11">
        <div>
          <h1 id="home-title" className="text-hero-title text-ink">
            Alex Leung
          </h1>
          <p className="text-hero-description mt-5 max-w-xl leading-relaxed text-ink">
            I work on ChatGPT at OpenAI. I write about software, technical
            books, and life outside work.
          </p>
        </div>
        <aside
          aria-labelledby="home-now-heading"
          className="border-t border-line pt-6 md:border-t-0 md:border-l md:pt-0 md:pl-6"
        >
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
            <h2 id="home-now-heading" className="text-editorial-label">
              Now
            </h2>
            <time
              dateTime={NOW_PAGE_LAST_UPDATED_ISO}
              className="font-mono text-xs text-muted"
            >
              {NOW_PAGE_LAST_UPDATED_DISPLAY}
            </time>
          </div>
          <NowEntry
            entry={NOW_CONTENT.entries[0]}
            headingLevel="h3"
            headingClassName="font-serif text-xl font-normal leading-snug"
            className="text-sm leading-relaxed"
          />
          <div className="mt-2 flex text-sm">
            <LinkText href="/now/" standalone>
              More on the Now page →
            </LinkText>
          </div>
        </aside>
      </div>
    </section>
  );
}
