import { ReactNode } from "react";

import Link from "next/link";

type LinkTextProps = {
  href: string;
  children: ReactNode;
  className?: string;
  external?: boolean;
  standalone?: boolean | "compact";
};

const inlineLinkClassName =
  "text-accent-link underline decoration-accent-link/40 underline-offset-2 transition-colors hover:text-accent-link-hover hover:decoration-accent-link-hover focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-link focus-visible:ring-offset-2 focus-visible:ring-offset-paper";

export function LinkText({
  href,
  children,
  className = inlineLinkClassName,
  external = false,
  standalone = false,
}: LinkTextProps) {
  const linkClassName = [
    className,
    standalone && "inline-flex min-h-11 min-w-11 items-center",
    standalone === "compact" && "md:[@media(pointer:fine)]:min-h-8",
  ]
    .filter(Boolean)
    .join(" ");

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={linkClassName}>
      {children}
    </Link>
  );
}
