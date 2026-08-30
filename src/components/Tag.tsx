import { ReactNode } from "react";

import Link from "next/link";

import { Chip, chipClassName } from "@/components/Chip";

type TagProps = {
  children: ReactNode;
  className?: string;
  href?: string;
};

export function Tag({ children, className = "", href }: TagProps) {
  const sharedClassName =
    `border-accent-link/25 bg-accent-secondary-soft/70 text-accent-link ${className}`.trim();

  if (href) {
    return (
      <Link
        href={href}
        className={chipClassName(
          `${sharedClassName} transition-colors hover:border-accent-link/50 hover:bg-accent-secondary-soft hover:text-accent-link-hover`
        )}
      >
        {children}
      </Link>
    );
  }

  return <Chip className={sharedClassName}>{children}</Chip>;
}
