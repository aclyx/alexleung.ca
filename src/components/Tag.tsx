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
    `border-accent-secondary/30 bg-accent-secondary/10 text-accent-secondary-soft ${className}`.trim();

  if (href) {
    return (
      <Link
        href={href}
        className={chipClassName(
          `${sharedClassName} transition-colors hover:border-accent-secondary hover:bg-accent-secondary/15 hover:text-white`
        )}
      >
        {children}
      </Link>
    );
  }

  return <Chip className={sharedClassName}>{children}</Chip>;
}
