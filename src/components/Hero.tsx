import { HiOutlineArrowRight, HiOutlineMail } from "react-icons/hi";

import { CTAButton } from "./CTAButton";

export function Hero() {
  return (
    <section
      id="home"
      className="flex flex-grow items-center justify-center pb-12 pt-[calc(var(--header-height)+1.5rem)] md:pb-12 md:pt-[calc(var(--header-height)+3rem)]"
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
            I build AI product surfaces and reliable software systems, then
            write down what I learn.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <CTAButton href="/contact/">
              <HiOutlineMail className="text-lg" /> Contact Alex
            </CTAButton>
            <CTAButton href="/blog/" variant="secondary">
              Read writing <HiOutlineArrowRight className="text-lg" />
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
                Writing and Open Experiments
              </h2>
              <p className="text-body mt-4 text-gray-200">
                I keep essays, technical notes, and project writeups here:
                software systems, AI product development, deep learning, and
                open experiments.
              </p>
              <p className="text-body mt-3 text-gray-200">
                Most pieces start from a concrete thing I tried: an
                implementation detail, a reading note, a tool behavior, or a
                product or system trade-off.
              </p>
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}
