import { FaRss } from "react-icons/fa6";

import { LinkText } from "@/components/LinkText";
import { SocialLinkList } from "@/components/SocialLinkList";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <section className="section-center py-4 text-center">
      <SocialLinkList
        analyticsPlacement="footer"
        itemClassName="mx-2 mb-4 inline-block list-none"
        linkClassName="text-xl text-white"
      />
      <p className="text-body-sm pb-1">
        <LinkText href="/feed.xml" className="inline-flex items-center gap-2">
          <FaRss aria-hidden="true" />
          <span>Subscribe via RSS</span>
        </LinkText>
      </p>
      <p>Copyright &copy; 2020 - {currentYear} Alex Leung</p>
    </section>
  );
}
