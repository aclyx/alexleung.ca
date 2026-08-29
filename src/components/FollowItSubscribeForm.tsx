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
  note?: string;
  placeholder?: string;
  buttonLabel?: string;
  action?: string;
  analyticsPlacement?: string;
};

export function FollowItSubscribeForm({
  className = "",
  title = "Get new posts by email",
  description = "Occasional updates when I publish something new.",
  note = "Follow.it sends the emails and includes an unsubscribe link.",
  placeholder = "Enter your email",
  buttonLabel = "Subscribe",
  action = DEFAULT_FOLLOW_IT_ACTION,
  analyticsPlacement = "newsletter_form",
}: FollowItSubscribeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const buttonClassName = [
    "text-body inline-flex min-h-11 w-full items-center justify-center rounded-md bg-accent-primary px-5 py-2.5 font-bold text-white transition-[background-color,opacity] duration-200 ease-expo-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-link focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
    isSubmitting
      ? "cursor-progress opacity-90"
      : "cursor-pointer hover:bg-accent-primary-hover",
  ].join(" ");

  return (
    <section
      aria-labelledby="follow-it-subscribe-title"
      className={surfaceClassNames({
        className: `max-w-xl p-6 md:p-8 ${className}`.trim(),
      })}
    >
      <header>
        <h2
          id="follow-it-subscribe-title"
          className="text-heading font-semibold text-ink"
        >
          {title}
        </h2>
        <p className="text-body-sm mt-2 text-muted">{description}</p>
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
          className="text-body min-h-11 w-full rounded-md border border-line bg-white px-4 py-2.5 text-ink placeholder:text-muted focus:border-accent-link focus:placeholder-transparent focus:outline-none focus:ring-1 focus:ring-accent-link"
        />
        <button
          type="submit"
          aria-disabled={isSubmitting}
          className={buttonClassName}
        >
          {isSubmitting ? "Subscribing..." : buttonLabel}
        </button>
      </form>
      {note ? <p className="mt-3 text-xs text-muted">{note}</p> : null}
    </section>
  );
}
