import { FaRss } from "react-icons/fa6";

import { LinkText } from "@/components/LinkText";
import { SiteKeyboardShortcutToggle } from "@/components/SiteKeyboardShortcutToggle";
import { SocialLinkList } from "@/components/SocialLinkList";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <section className="section-center py-4 text-center">
      <SocialLinkList
        analyticsPlacement="footer"
        itemClassName="mx-1 mb-3 inline-block list-none"
        linkClassName="inline-flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl text-white transition-colors hover:border-accent-secondary/60 hover:text-accent-secondary"
      />
      <div className="text-body-sm flex items-center justify-center gap-2 pb-1">
        <LinkText
          href="/feed.xml"
          className="inline-flex min-h-11 items-center gap-2 px-3"
        >
          <FaRss aria-hidden="true" />
          <span>Subscribe via RSS</span>
        </LinkText>
        <SiteKeyboardShortcutToggle />
      </div>
      <p>Copyright &copy; 2020 - {currentYear} Alex Leung</p>
    </section>
  );
}
