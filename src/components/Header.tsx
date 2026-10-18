"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NavMenu } from "@/components/NavMenu";

export default function Header() {
  const pathname = usePathname();
  const normalizedPathname =
    pathname === "/" ? "/" : pathname.replace(/\/$/, "");

  const isActive = (canonicalPath: string) =>
    canonicalPath === "/"
      ? normalizedPathname === "/"
      : normalizedPathname === canonicalPath ||
        normalizedPathname.startsWith(`${canonicalPath}/`);

  return (
    <header className="section-center">
      <nav
        aria-label="Primary navigation"
        className="flex min-h-18 flex-wrap items-center justify-between gap-x-3 border-b border-line py-2 sm:min-h-[82px]"
      >
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-sm font-mono text-xs text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-link focus-visible:ring-offset-4 focus-visible:ring-offset-paper sm:text-[13px]"
        >
          alexleung.ca
        </Link>
        <NavMenu isActive={isActive} />
      </nav>
    </header>
  );
}
