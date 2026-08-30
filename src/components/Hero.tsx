import Link from "next/link";

import { ResponsiveImage } from "@/components/ResponsiveImage";
import {
  getStaticImageFallback,
  getStaticImageSourceSet,
} from "@/lib/localImageMetadata";

export function Hero() {
  const portraitSrcSet = getStaticImageSourceSet("heroPortrait");
  const portraitFallback = getStaticImageFallback("heroPortrait");

  return (
    <section
      id="about"
      aria-labelledby="home-title"
      className="section-center pb-16 pt-[calc(var(--header-height)+3rem)] md:pb-24 md:pt-[calc(var(--header-height)+5rem)]"
    >
      <div className="grid items-center gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] md:gap-16 lg:gap-24">
        <div className="hero-enter order-2 max-w-2xl md:order-1">
          <p className="text-hero-subtitle mb-5 font-semibold uppercase tracking-[0.14em] text-accent-link">
            Software engineer and writer
          </p>
          <h1
            id="home-title"
            className="text-hero-title font-bold leading-[0.98] tracking-[-0.045em] text-ink"
          >
            Alex Leung
          </h1>
          <p className="mt-7 max-w-xl text-xl leading-relaxed text-muted md:text-2xl">
            I build products and systems that make new technology useful in
            everyday life. I write about software, technical books, and life
            outside work.
          </p>
          <Link
            href="/now/"
            className="link-arrow mt-5 inline-flex min-h-11 items-center gap-2 text-base font-medium text-ink underline decoration-line underline-offset-4 hover:text-accent-link-hover focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-link focus-visible:ring-offset-4 focus-visible:ring-offset-paper"
          >
            Now — what I’m reading and studying
            <span aria-hidden="true">→</span>
          </Link>
          <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3">
            <Link
              href="/blog/"
              className="link-arrow inline-flex min-h-11 items-center gap-2 font-semibold text-accent-link underline decoration-accent-link/35 underline-offset-4 hover:text-accent-link-hover focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-link focus-visible:ring-offset-4 focus-visible:ring-offset-paper"
            >
              Read my writing <span aria-hidden="true">→</span>
            </Link>
            <Link
              href="/contact/"
              className="link-arrow inline-flex min-h-11 items-center gap-2 font-semibold text-ink underline decoration-line underline-offset-4 hover:text-accent-link-hover focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-link focus-visible:ring-offset-4 focus-visible:ring-offset-paper"
            >
              Get in touch <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <div className="hero-enter-delayed order-1 md:order-2">
          <ResponsiveImage
            src={portraitFallback.path}
            srcSet={portraitSrcSet}
            alt="Alex Leung sitting in an art studio"
            width={portraitFallback.width}
            height={portraitFallback.height}
            sizes="(min-width: 1120px) 430px, (min-width: 768px) 38vw, calc(100vw - 2.5rem)"
            pictureClassName="block"
            className="aspect-[3/2] w-full rounded-[1.5rem] border border-line object-cover shadow-[0_20px_50px_rgba(32,35,31,0.08)]"
            priority
            fetchPriority="high"
            decoding="async"
          />
        </div>
      </div>
    </section>
  );
}
