import { ReactNode } from "react";

import Link from "next/link";

type LinkTextProps = {
  href: string;
  children: ReactNode;
  className?: string;
  external?: boolean;
};

const inlineLinkClassName =
  "text-accent-link underline decoration-accent-link/50 transition-colors hover:text-accent-link-hover hover:decoration-accent-link-hover";

export function LinkText({
  href,
  children,
  className = inlineLinkClassName,
  external = false,
}: LinkTextProps) {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
