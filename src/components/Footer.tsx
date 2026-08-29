import { FaRss } from "react-icons/fa6";

import { LinkText } from "@/components/LinkText";
import { SocialLinkList } from "@/components/SocialLinkList";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-line">
      <div className="section-center flex flex-col gap-5 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p>&copy; 2020–{currentYear} Alex Leung</p>
          <LinkText
            href="/feed.xml"
            className="mt-2 inline-flex min-h-11 items-center gap-2 text-accent-link underline decoration-accent-link/35 underline-offset-4 hover:text-accent-link-hover"
          >
            <FaRss aria-hidden="true" />
            <span>Subscribe via RSS</span>
          </LinkText>
        </div>
        <SocialLinkList
          analyticsPlacement="footer"
          className="flex flex-wrap"
          itemClassName="inline-block list-none"
          linkClassName="inline-flex size-11 items-center justify-center rounded-full text-lg text-muted transition-[background-color,color] hover:bg-accent-secondary-soft hover:text-accent-link-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-link"
        />
      </div>
    </footer>
  );
}
