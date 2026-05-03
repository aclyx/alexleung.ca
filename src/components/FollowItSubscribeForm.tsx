"use client";

import { useState } from "react";

import { surfaceClassNames } from "@/components/Surface";
import { trackNewsletterSubscribe } from "@/lib/analytics";

const DEFAULT_FOLLOW_IT_ACTION =
  "https://api.follow.it/subscription-form/RkY1QllwUjBPUEZhSnNWMnZQVjdlK2tMZWtJOWRrVGlma0xlT09iU0pIUWtPWjVVMWVucTE1WWdNYjZIckhoWGwzTy9yME5WNjJaQUxyUG5oclg2VC9Td2FIRGl5aWZZL3JheTB0UTdHOFZMaXJDV1FXcGlham5lSlFXc013NGl8bTM1Qkt0b1VwU0RNS1Z1Y1EzU0dnUkt1NjFOQ0FBd01wbW5RTFB2dHFHVT0=/8";

type FollowItSubscribeFormProps = {
  className?: string;
  title?: string;
  description?: string;
  placeholder?: string;
  buttonLabel?: string;
  action?: string;
  analyticsPlacement?: string;
};

export function FollowItSubscribeForm({
  className = "",
  title = "Get new posts by email",
  description = "Subscribe for occasional updates when I publish something new.",
  placeholder = "Enter your email",
  buttonLabel = "Subscribe",
  action = DEFAULT_FOLLOW_IT_ACTION,
  analyticsPlacement = "newsletter_form",
}: FollowItSubscribeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const buttonClassName = [
    "text-body inline-flex w-full items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-accent-primary px-5 py-2.5 font-bold text-white transition-all duration-200 ease-expo-out",
    isSubmitting
      ? "cursor-progress opacity-90"
      : "cursor-pointer hover:from-blue-600 hover:to-accent-primary-hover",
  ].join(" ");

  return (
    <section
      aria-labelledby="follow-it-subscribe-title"
      className={surfaceClassNames({
        className: `mx-auto max-w-xl p-6 md:p-8 ${className}`.trim(),
      })}
    >
      <header className="text-center">
        <h2
          id="follow-it-subscribe-title"
          className="text-heading font-semibold text-white"
        >
          {title}
        </h2>
        <p className="text-body-sm mt-2 text-gray-300">{description}</p>
      </header>

      <form
        action={action}
        method="post"
        className="mt-5 space-y-3"
        aria-busy={isSubmitting}
        onSubmit={() => {
          trackNewsletterSubscribe(analyticsPlacement);
          setIsSubmitting(true);
        }}
      >
        <label htmlFor="follow-it-email" className="sr-only">
          Email address
        </label>
        <input
          id="follow-it-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder={placeholder}
          readOnly={isSubmitting}
          className="text-body w-full rounded-md border-2 border-white/15 bg-white/5 px-4 py-2.5 text-center text-white placeholder:text-gray-400 focus:border-accent-link focus:placeholder-transparent focus:outline-none"
        />
        <button
          type="submit"
          aria-disabled={isSubmitting}
          className={buttonClassName}
        >
          {isSubmitting ? "Subscribing..." : buttonLabel}
        </button>
      </form>
    </section>
  );
}
