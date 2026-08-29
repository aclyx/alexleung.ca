"use client";

import { useEffect, useRef, useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";

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
            className="relative z-50 inline-flex min-h-11 items-center text-lg font-bold tracking-[-0.025em] text-ink transition-colors hover:text-accent-link-hover md:text-xl"
          >
            Alex Leung
          </Link>

          <DesktopNav isActive={isActive} onNavigate={handleNavigation} />

          <button
            ref={menuButtonRef}
            onClick={toggleMenu}
            className="relative z-50 flex size-11 items-center justify-center rounded-md text-xl text-ink transition-[background-color,color] duration-200 hover:bg-accent-secondary-soft hover:text-accent-link-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-link md:hidden"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav-drawer"
          >
            <span
              className={`block transition-transform duration-200 ${
                isMenuOpen ? "rotate-90" : "rotate-0"
              }`}
            >
              {isMenuOpen ? <FaTimes /> : <FaBars />}
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
