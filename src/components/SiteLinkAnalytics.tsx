"use client";

import { useEffect } from "react";

import {
  trackExternalLinkClick,
  trackInternalLinkClick,
} from "@/lib/analytics";

const MAX_LINK_TEXT_LENGTH = 120;

function getLinkText(link: HTMLAnchorElement) {
  return (
    link.innerText ||
    link.textContent ||
    link.getAttribute("aria-label") ||
    link.getAttribute("title") ||
    link.href
  )
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, MAX_LINK_TEXT_LENGTH);
}

export function SiteLinkAnalytics() {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const link = target.closest<HTMLAnchorElement>("a[href]");

      if (!link) {
        return;
      }

      const rawHref = link.getAttribute("href");

      if (!rawHref || rawHref.startsWith("#")) {
        return;
      }

      const destination = new URL(link.href, window.location.href);
      const currentPath = `${window.location.pathname}${window.location.search}`;
      const params = {
        current_path: currentPath,
        link_text: getLinkText(link),
        link_url: destination.href,
      };

      if (
        destination.protocol === "http:" ||
        destination.protocol === "https:"
      ) {
        if (destination.origin === window.location.origin) {
          trackInternalLinkClick({
            ...params,
            destination_path: `${destination.pathname}${destination.search}`,
          });
          return;
        }

        trackExternalLinkClick({
          ...params,
          link_host: destination.host,
        });
        return;
      }

      trackExternalLinkClick({
        ...params,
        link_host: destination.protocol.replace(":", ""),
      });
    }

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);

  return null;
}
