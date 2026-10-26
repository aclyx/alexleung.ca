import { LinkText } from "@/components/LinkText";
import { NOW_CONTENT } from "@/constants/now";

export function Hero() {
  return (
    <section id="about" aria-labelledby="home-title" className="section-center">
      <div className="border-b border-line py-8 md:py-11">
        <h1 id="home-title" className="text-hero-title text-ink">
          Alex Leung
        </h1>
        <p className="text-hero-description mt-5 max-w-xl leading-relaxed text-ink">
          I work on ChatGPT at OpenAI. I write about software, technical books,
          and life outside work.
        </p>
        <p className="text-body-sm mt-3 max-w-2xl leading-relaxed text-muted">
          {NOW_CONTENT.homePreview}{" "}
          <span className="whitespace-nowrap">
            <LinkText href="/now/" standalone>
              Now →
            </LinkText>
          </span>
        </p>
      </div>
    </section>
  );
}
