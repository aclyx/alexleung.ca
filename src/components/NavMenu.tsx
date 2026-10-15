import Link from "next/link";

import { NAV_LINKS } from "@/constants/navigation";

type NavMenuProps = {
  isActive: (canonicalPath: string) => boolean;
};

export function NavMenu({ isActive }: NavMenuProps) {
  return (
    <ul className="flex gap-4 sm:gap-6">
      {NAV_LINKS.map((link) => {
        const active = isActive(link.canonicalPath);

        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`nav-link ${active ? "nav-link--active" : "nav-link--inactive"}`}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
