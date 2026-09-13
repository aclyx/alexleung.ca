"use client";

import { useState } from "react";

import { actionClassNames, fieldClassNames } from "@/components/controlStyles";
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
  headingLevel?: "h2" | "h3";
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
  headingLevel = "h2",
}: FollowItSubscribeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const Heading = headingLevel;
  const buttonClassName = actionClassNames({
    className: `w-full ${isSubmitting ? "cursor-progress opacity-90" : "cursor-pointer"}`,
  });

  return (
    <section
      aria-labelledby="follow-it-subscribe-title"
      className={surfaceClassNames({
        padding: "responsive",
        className: `max-w-xl ${className}`.trim(),
      })}
    >
      <header>
        <Heading
          id="follow-it-subscribe-title"
          className="text-heading font-semibold text-ink"
        >
          {title}
        </Heading>
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
          className={fieldClassNames()}
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
