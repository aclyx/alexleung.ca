import { HiOutlineArrowRight, HiOutlineMail } from "react-icons/hi";

import { CTAButton } from "./CTAButton";

export function Hero() {
  return (
    <section
      id="home"
      className="flex items-center justify-center pb-8 pt-[calc(var(--header-height)+1.5rem)] md:pb-10 md:pt-[calc(var(--header-height)+2.5rem)]"
    >
      <div className="section-center">
        <div className="mx-auto max-w-3xl">
          <p className="text-hero-subtitle mb-4 tracking-wider">
            Hi, my name is
          </p>
          <h1 className="text-hero-title mb-4 inline-block font-black uppercase leading-[0.9] tracking-[0.12rem] md:pb-4 md:tracking-[0.16rem]">
            Alex Leung
          </h1>

          <h2 className="text-hero-description">
            Software Engineer and Writer.
          </h2>
          <p className="mt-3 text-sm text-gray-200 md:text-gray-300">
            I work on AI products at OpenAI in San Francisco. I write about
            software, AI tools, technical books, experiments, and life outside
            work.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <CTAButton href="/contact/">
              <HiOutlineMail className="text-lg" /> Contact me
            </CTAButton>
            <CTAButton href="/blog/" variant="secondary">
              Read writing <HiOutlineArrowRight className="text-lg" />
            </CTAButton>
          </div>
        </div>
      </div>
    </section>
  );
}
