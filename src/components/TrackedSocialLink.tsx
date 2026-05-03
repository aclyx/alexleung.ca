"use client";

import { ReactNode } from "react";

import { trackContactLinkClick } from "@/lib/analytics";

type TrackedSocialLinkProps = {
  analyticsPlacement: string;
  children: ReactNode;
  className?: string;
  href: string;
  label: string;
  rel: string;
};

export function TrackedSocialLink({
  analyticsPlacement,
  children,
  className,
  href,
  label,
  rel,
}: TrackedSocialLinkProps) {
  return (
    <a
      href={href}
      className={className}
      rel={rel}
      target="_blank"
      aria-label={label}
      onClick={() => {
        trackContactLinkClick({
          label,
          placement: analyticsPlacement,
          url: href,
        });
      }}
    >
      {children}
    </a>
  );
}
