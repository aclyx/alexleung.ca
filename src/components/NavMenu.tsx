import Link from "next/link";

import { NAV_LINKS } from "@/constants/navigation";

type NavItemProps = {
  href: string;
  label: string;
  active: boolean;
  mobile?: boolean;
  tabIndex?: number;
  onClick?: () => void;
};

function NavItem({
  href,
  label,
  active,
  mobile = false,
  tabIndex,
  onClick,
}: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={
        active ? (href.includes("#") ? "location" : "page") : undefined
      }
      className={
        mobile
          ? `mobile-nav-link ${active ? "mobile-nav-link--active" : "mobile-nav-link--inactive"}`
          : `nav-link ${active ? "nav-link--active" : "nav-link--inactive"}`
      }
      tabIndex={tabIndex}
    >
      {label}
    </Link>
  );
}

type DesktopNavProps = {
  isActive: (canonicalPath: string) => boolean;
  onNavigate: (href: string) => void;
};

export function DesktopNav({ isActive, onNavigate }: DesktopNavProps) {
  return (
    <ul className="hidden gap-7 md:flex">
      {NAV_LINKS.map((link) => (
        <li key={link.href}>
          <NavItem
            {...link}
            active={isActive(link.canonicalPath)}
            onClick={() => onNavigate(link.href)}
          />
        </li>
      ))}
    </ul>
  );
}

type MobileNavDrawerProps = {
  isOpen: boolean;
  isActive: (canonicalPath: string) => boolean;
  onNavigate: (href: string) => void;
};

export function MobileNavDrawer({
  isOpen,
  isActive,
  onNavigate,
}: MobileNavDrawerProps) {
  return (
    <nav
      id="mobile-nav-drawer"
      aria-label="Mobile navigation"
      className={`fixed inset-x-0 top-[var(--header-height)] z-40 max-h-[calc(100dvh-var(--header-height))] overflow-y-auto overscroll-contain border-b border-line bg-paper/98 shadow-lg backdrop-blur-md transition-[opacity,transform] duration-200 md:hidden ${
        isOpen
          ? "translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-4 opacity-0"
      }`}
      aria-hidden={!isOpen}
    >
      <ul className="section-center flex flex-col py-5">
        {NAV_LINKS.map((link, index) => (
          <li
            key={link.href}
            className={`transition-[opacity,transform] duration-200 ${
              isOpen ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"
            }`}
            style={{
              transitionDelay: isOpen ? `${index * 35}ms` : "0ms",
            }}
          >
            <NavItem
              {...link}
              active={isActive(link.canonicalPath)}
              mobile
              onClick={() => onNavigate(link.href)}
              tabIndex={isOpen ? 0 : -1}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}
