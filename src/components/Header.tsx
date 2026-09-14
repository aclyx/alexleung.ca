"use client";

import { useEffect, useRef, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { DesktopNav, MobileNavDrawer } from "@/components/NavMenu";

export default function Header() {
  const pathname = usePathname();
  const [currentHash, setCurrentHash] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const hasMountedRef = useRef(false);
  const shouldRestoreMenuFocusRef = useRef(false);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        shouldRestoreMenuFocusRef.current = true;
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handleResize = () => {
      if (mediaQuery.matches && isMenuOpen) {
        shouldRestoreMenuFocusRef.current = false;
        setIsMenuOpen(false);
      }
    };
    mediaQuery.addEventListener("change", handleResize);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      mediaQuery.removeEventListener("change", handleResize);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (!isMenuOpen && shouldRestoreMenuFocusRef.current) {
      menuButtonRef.current?.focus();
      shouldRestoreMenuFocusRef.current = false;
    }
  }, [isMenuOpen]);

  useEffect(() => {
    shouldRestoreMenuFocusRef.current = false;
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const syncHash = () => setCurrentHash(window.location.hash);

    syncHash();
    window.addEventListener("hashchange", syncHash);
    window.addEventListener("popstate", syncHash);

    return () => {
      window.removeEventListener("hashchange", syncHash);
      window.removeEventListener("popstate", syncHash);
    };
  }, [pathname]);

  const toggleMenu = () => {
    shouldRestoreMenuFocusRef.current = isMenuOpen;
    setIsMenuOpen(!isMenuOpen);
  };
  const closeMenu = () => {
    shouldRestoreMenuFocusRef.current = false;

    if (
      document.activeElement instanceof HTMLElement &&
      document.activeElement.closest("#mobile-nav-drawer")
    ) {
      document.activeElement.blur();
    }

    setIsMenuOpen(false);
  };
  const handleNavigation = (href: string) => {
    setCurrentHash(new URL(href, window.location.href).hash);
    closeMenu();
  };
  const normalizedPathname =
    pathname === "/" ? "/" : pathname.replace(/\/$/, "");

  const isActive = (canonicalLocation: string) => {
    const [canonicalPath, canonicalHash] = canonicalLocation.split("#");
    const normalizedCanonicalPath =
      canonicalPath === "/" ? "/" : canonicalPath.replace(/\/$/, "");

    if (canonicalHash) {
      return (
        normalizedPathname === normalizedCanonicalPath &&
        currentHash === `#${canonicalHash}`
      );
    }

    if (normalizedCanonicalPath === "/") {
      return normalizedPathname === "/";
    }

    return (
      normalizedPathname === normalizedCanonicalPath ||
      normalizedPathname.startsWith(`${normalizedCanonicalPath}/`)
    );
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 h-[var(--header-height)] border-b border-line bg-paper/95 backdrop-blur-md">
        <nav
          aria-label="Primary navigation"
          className="section-center flex h-full items-center justify-between"
        >
          <Link
            href="/"
            onClick={() => handleNavigation("/")}
            className="relative z-50 inline-flex min-h-11 items-center rounded-sm text-lg font-bold tracking-[-0.025em] text-ink transition-colors hover:text-accent-link-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-link focus-visible:ring-offset-4 focus-visible:ring-offset-paper md:text-xl"
          >
            Alex Leung
          </Link>

          <DesktopNav isActive={isActive} onNavigate={handleNavigation} />

          <button
            ref={menuButtonRef}
            onClick={toggleMenu}
            className="relative z-50 flex size-11 items-center justify-center rounded-md text-xl text-ink transition-colors hover:bg-accent-secondary-soft hover:text-accent-link-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-link focus-visible:ring-offset-2 focus-visible:ring-offset-paper md:hidden"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav-drawer"
          >
            <span
              aria-hidden="true"
              data-menu-icon
              className="relative block size-5"
            >
              <span
                data-menu-line="top"
                className={`absolute top-1 left-0 block h-0.5 w-5 rounded-full bg-current transition-[translate,rotate,opacity,scale] duration-200 ease-expo-out motion-reduce:transition-none ${
                  isMenuOpen
                    ? "translate-y-[5px] rotate-45"
                    : "translate-y-0 rotate-0"
                }`}
              />
              <span
                data-menu-line="middle"
                className={`absolute top-[9px] left-0 block h-0.5 w-5 rounded-full bg-current transition-[translate,rotate,opacity,scale] duration-200 ease-expo-out motion-reduce:transition-none ${
                  isMenuOpen
                    ? "scale-x-50 opacity-0"
                    : "scale-x-100 opacity-100"
                }`}
              />
              <span
                data-menu-line="bottom"
                className={`absolute top-[14px] left-0 block h-0.5 w-5 rounded-full bg-current transition-[translate,rotate,opacity,scale] duration-200 ease-expo-out motion-reduce:transition-none ${
                  isMenuOpen
                    ? "-translate-y-[5px] -rotate-45"
                    : "translate-y-0 rotate-0"
                }`}
              />
            </span>
          </button>
        </nav>
      </header>

      <MobileNavDrawer
        isOpen={isMenuOpen}
        isActive={isActive}
        onNavigate={handleNavigation}
      />
    </>
  );
}
