"use client";

import { useEffect, useRef, useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { DesktopNav, MobileNavDrawer } from "@/components/NavMenu";

export default function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const hasMountedRef = useRef(false);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  // Close menu when resizing to desktop width
  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handleResize = () => {
      if (mediaQuery.matches && isMenuOpen) {
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

    if (!isMenuOpen) {
      menuButtonRef.current?.focus();
    }
  }, [isMenuOpen]);

  // Close mobile menu on route changes (including browser back/forward)
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);
  const normalizedPathname =
    pathname === "/" ? "/" : pathname.replace(/\/$/, "");

  const isActive = (canonicalPath: string) => {
    if (canonicalPath === "/") {
      return normalizedPathname === "/";
    }

    return (
      normalizedPathname === canonicalPath ||
      normalizedPathname.startsWith(`${canonicalPath}/`)
    );
  };

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 h-[var(--header-height)] border-b border-white/10 bg-black/80 backdrop-blur-sm">
        <nav className="mx-auto flex h-full w-[90vw] max-w-content items-center justify-between">
          {/* Logo/Name */}
          <Link
            href="/"
            onClick={closeMenu}
            className="relative z-50 inline-flex min-h-11 items-center text-lg font-black uppercase tracking-wider transition-colors hover:text-gray-300 md:text-2xl"
          >
            Alex Leung
          </Link>

          {/* Desktop Navigation */}
          <DesktopNav isActive={isActive} />

          {/* Mobile Menu Button */}
          <button
            ref={menuButtonRef}
            onClick={toggleMenu}
            className="relative z-50 flex size-11 items-center justify-center rounded-md text-2xl transition-all duration-300 hover:bg-white/10 hover:text-gray-300 md:hidden"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav-drawer"
          >
            <span
              className={`block transition-transform duration-300 ${
                isMenuOpen ? "rotate-90" : "rotate-0"
              }`}
            >
              {isMenuOpen ? <FaTimes /> : <FaBars />}
            </span>
          </button>
        </nav>
      </header>

      {isMenuOpen ? (
        <MobileNavDrawer
          isOpen={isMenuOpen}
          isActive={isActive}
          onClose={closeMenu}
        />
      ) : null}
    </>
  );
}
