import { HiOutlineArrowRight, HiOutlineUser } from "react-icons/hi";

import { CTAButton } from "./CTAButton";

export function Hero() {
  return (
    <section
      id="home"
      className="flex flex-grow items-center justify-center pb-12 pt-[calc(var(--header-height)+1.5rem)] md:pb-12 md:pt-[calc(var(--header-height)+3rem)]"
    >
      <div className="section-center">
        <div className="max-w-3xl">
          <p className="text-hero-subtitle mb-4 tracking-wider">
            Hi, my name is
          </p>
          <h1 className="text-hero-title mb-4 inline-block font-black uppercase leading-[0.9] tracking-[0.12rem] md:pb-4 md:tracking-[0.16rem]">
            Alex Leung
          </h1>

          <h2 className="text-hero-description">
            Software Engineer and Occasional Writer.
          </h2>
          <p className="mt-3 text-sm italic text-gray-200 md:text-gray-300">
            I build software, write notes, and make small tools for
            understanding systems and AI.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <CTAButton href="/blog/">
              Read writing <HiOutlineArrowRight className="text-lg" />
            </CTAButton>
            <CTAButton href="/about/" variant="secondary">
              <HiOutlineUser className="text-lg" /> About
            </CTAButton>
          </div>

          <div className="mt-10">
            <section
              aria-labelledby="positioning-heading"
              className="surface-static p-5 md:p-6"
            >
              <h2
                id="positioning-heading"
                className="text-heading font-semibold"
              >
                What you&apos;ll find here
              </h2>
              <p className="text-body mt-4 text-gray-200">
                I keep essays, notes, and small project writeups here: software
                engineering, system design, AI, product work, and learning.
              </p>
              <p className="text-body mt-3 text-gray-200">
                I tend to write from the practical edge of those topics: what I
                tried, what held up, where the tools helped, and where the rough
                edges stayed visible.
              </p>
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}
