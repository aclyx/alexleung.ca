import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/Badge";
import { PageShell } from "@/components/PageShell";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";

export const metadata: Metadata = {
  title: "Imagegen Directions | Alex Leung",
  description: "A private visual review of generated image directions.",
  robots: {
    index: false,
    follow: false,
  },
};

const coverDirections = [
  {
    title: "Farming Expensive Coding Agent Sessions",
    href: "/blog/farming-expensive-coding-agent-sessions/",
    current: "/assets/blog/farming-expensive-coding-agent-sessions/cover.webp",
    currentAlt:
      "Current illustration of Alex at a desk watching token-like lights flow from a laptop",
    concept: "/assets/imagegen-review/coding-agent-session-literal.webp",
    conceptAlt:
      "Generated coding workspace with an assistant transcript, code diff, test results, checklists, and a grading rubric",
    mechanism:
      "Show the actual working surface: the agent transcript, code diff, tests, prompt notes, and grader. It is less stylized than the current cover but still explains what the expensive session leaves behind.",
  },
  {
    title: "Dropout as Shared-Parameter Bagging",
    href: "/blog/dropout-as-implicit-bagging/",
    current: "/assets/blog/dropout-as-implicit-bagging/cover.webp",
    currentAlt:
      "Current illustration of Alex drawing neural network diagrams beside a book",
    concept: "/assets/imagegen-review/dropout-sampled-subnetworks.webp",
    conceptAlt:
      "Generated chalkboard diagram showing one neural network, four sampled subnetworks with different nodes removed, and a combined prediction",
    mechanism:
      "Use the diagram the post is actually teaching: one full network, several aligned sampled subnetworks, and a combined prediction. The setting adds texture without turning the mechanism into a metaphor.",
  },
  {
    title: "One Manifest for Responsive Images",
    href: "/blog/making-responsive-images-just-work/",
    current: "/assets/blog/making-responsive-images-just-work/cover.webp",
    currentAlt:
      "Current illustration of Alex measuring framed responsive image sizes",
    concept: "/assets/imagegen-review/responsive-images-devices.webp",
    conceptAlt:
      "Generated development desk with the same mountain image rendered on a monitor, tablet, and phone beside a simple variant workflow",
    mechanism:
      "Put the result on recognizable devices. The same photograph on desktop, tablet, and phone makes the responsive behavior concrete while the monitor keeps the source-to-variant workflow visible.",
  },
];

const socialCards = [
  {
    eyebrow: "AI-assisted coding / June 14, 2026",
    title: "Farming Expensive Coding Agent Sessions",
  },
  {
    eyebrow: "Deep learning / March 7, 2026",
    title: "Dropout as Shared-Parameter Bagging",
  },
];

function SocialCard({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="relative aspect-[1200/630] overflow-hidden rounded-md border border-white/15 bg-slate-950 shadow-lg">
      <img
        src="/assets/social-cards/substrate.webp"
        alt=""
        width={1672}
        height={941}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 flex flex-col justify-between bg-black/20 p-5 sm:p-8">
        <div className="flex items-center justify-between gap-4 text-xs font-semibold text-gray-200 sm:text-sm">
          <span>alexleung.ca</span>
          <span className="text-accent-secondary-soft">Writing</span>
        </div>
        <div className="max-w-[82%]">
          <p className="mb-2 text-xs text-gray-300 sm:text-sm">{eyebrow}</p>
          <h3 className="text-lg leading-tight font-black text-white sm:text-2xl md:text-3xl">
            {title}
          </h3>
        </div>
      </div>
    </div>
  );
}

export default function ImagegenReviewPage() {
  return (
    <PageShell title="Imagegen Directions" titleId="imagegen-directions">
      <ResponsiveContainer variant="wide" className="space-y-16 pb-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-body-lg text-gray-300">
            Three places where generated imagery can carry meaning: technical
            covers that reveal the mechanism, a reusable social-card system, and
            an occasional visual snapshot for the Now page.
          </p>
        </div>

        <section aria-labelledby="technical-covers" className="space-y-8">
          <div className="max-w-3xl">
            <Badge tone="warning">Direction 1</Badge>
            <h2
              id="technical-covers"
              className="text-heading mt-4 font-black text-white"
            >
              Mechanism-first technical covers
            </h2>
            <p className="text-body mt-3 text-gray-300">
              Keep portraits for personal writing. For mechanism-heavy posts,
              show the actual software state, devices, or diagram a reader will
              encounter in the post.
            </p>
          </div>

          <div className="space-y-10">
            {coverDirections.map((direction) => (
              <article
                key={direction.title}
                className="grid gap-6 border-t border-white/15 pt-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)] lg:items-start"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <figure>
                    <div className="overflow-hidden rounded-md border border-white/10 bg-slate-950">
                      <img
                        src={direction.current}
                        alt={direction.currentAlt}
                        width={1536}
                        height={1024}
                        className="aspect-[3/2] w-full object-cover"
                      />
                    </div>
                    <figcaption className="mt-2 text-sm text-gray-400">
                      Current cover
                    </figcaption>
                  </figure>

                  <figure>
                    <div className="overflow-hidden rounded-md border border-accent-secondary/35 bg-slate-950">
                      <img
                        src={direction.concept}
                        alt={direction.conceptAlt}
                        width={1536}
                        height={1024}
                        className="aspect-[3/2] w-full object-cover"
                      />
                    </div>
                    <figcaption className="mt-2 text-sm text-accent-secondary-soft">
                      Revised concept
                    </figcaption>
                  </figure>
                </div>

                <div>
                  <h3 className="text-heading-sm font-semibold text-white">
                    <Link
                      href={direction.href}
                      className="underline decoration-white/25 underline-offset-4 transition-colors hover:text-accent-link"
                    >
                      {direction.title}
                    </Link>
                  </h3>
                  <p className="text-body mt-3 text-gray-300">
                    {direction.mechanism}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="social-cards" className="space-y-8">
          <div className="max-w-3xl border-t border-white/15 pt-10">
            <Badge tone="success">Applied</Badge>
            <h2
              id="social-cards"
              className="text-heading mt-4 font-black text-white"
            >
              Generated substrate, typeset social cards
            </h2>
            <p className="text-body mt-3 text-gray-300">
              Generate the tactile background once, then render titles, dates,
              and categories as real type. The system stays recognizable while
              long titles remain exact and accessible.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {socialCards.map((card) => (
              <SocialCard key={card.title} {...card} />
            ))}
          </div>

          <p className="max-w-3xl text-sm text-gray-400">
            Best opportunity: use this as the default Open Graph frame, then
            substitute a post cover only when the cover remains clear behind
            title text at 1200 x 630.
          </p>
        </section>

        <section aria-labelledby="now-postcard" className="space-y-8">
          <div className="max-w-3xl border-t border-white/15 pt-10">
            <Badge tone="success">Applied</Badge>
            <h2
              id="now-postcard"
              className="text-heading mt-4 font-black text-white"
            >
              A state postcard for substantial Now updates
            </h2>
            <p className="text-body mt-3 text-gray-300">
              Turn the current facts into one honest still life: the move, the
              work, the book, tennis, and language study. It should mark a real
              change in season, not become a decorative monthly obligation.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)] lg:items-center">
            <figure>
              <div className="overflow-hidden rounded-md border border-white/15 bg-slate-950 shadow-lg">
                <img
                  src="/assets/now/state-postcard.webp"
                  alt="Generated still life of a partly unpacked San Francisco apartment table with a laptop, notebook, technical book, tennis equipment, and language cards"
                  width={1536}
                  height={1024}
                  className="aspect-[3/2] w-full object-cover"
                />
              </div>
              <figcaption className="mt-2 text-sm text-gray-400">
                Concept for the June 2026 update
              </figcaption>
            </figure>

            <div className="space-y-5">
              <div>
                <p className="text-sm font-semibold text-accent-secondary-soft">
                  Placement
                </p>
                <p className="text-body mt-1 text-gray-300">
                  Below the update date and opening paragraph, before the real
                  San Francisco photo grid.
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-accent-secondary-soft">
                  Cadence
                </p>
                <p className="text-body mt-1 text-gray-300">
                  Only when the page changes materially: a move, new role, major
                  project, or new season of attention.
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-accent-secondary-soft">
                  Guardrail
                </p>
                <p className="text-body mt-1 text-gray-300">
                  Keep real photos dominant. The generated image compresses
                  context; it does not stand in for lived evidence.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="recommendation"
          className="border-t border-white/15 pt-10"
        >
          <div className="max-w-3xl">
            <h2
              id="recommendation"
              className="text-heading font-black text-white"
            >
              My read
            </h2>
            <div className="text-body mt-4 space-y-3 text-gray-300">
              <p>
                The technical-cover system is the strongest direction and worth
                extending to future mechanism-led posts.
              </p>
              <p>
                The social-card substrate now generates a deterministic 1200 x
                630 image for every blog post during the image workflow.
              </p>
              <p>
                The Now postcard now sits between the opening update and the
                real San Francisco photo grid, where it remains contextual.
              </p>
            </div>
          </div>
        </section>
      </ResponsiveContainer>
    </PageShell>
  );
}
