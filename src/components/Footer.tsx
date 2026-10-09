import { LinkText } from "@/components/LinkText";
import { SocialLinkList } from "@/components/SocialLinkList";

const footerLinkClassName =
  "inline-flex min-h-11 min-w-11 items-center justify-center text-accent-link underline decoration-accent-link/40 underline-offset-4 transition-colors hover:text-accent-link-hover focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-link focus-visible:ring-offset-2 focus-visible:ring-offset-paper";

export default function Footer() {
  return (
    <footer className="section-center">
      <div className="flex flex-col items-start justify-between gap-x-5 gap-y-1 border-t border-line py-4 text-xs text-muted sm:flex-row sm:items-center">
        <p>Alex Leung</p>
        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap gap-x-3 gap-y-0 sm:gap-x-5"
        >
          <SocialLinkList
            analyticsPlacement="footer"
            className="flex gap-3 sm:gap-5"
            linkIds={[2, 1, 4]}
            linkClassName={footerLinkClassName}
            iconClassName="hidden"
            showLabel
            labelFormatter={(label) =>
              label.replace(" Profile", "").replace("X (Twitter)", "X")
            }
          />
          <LinkText href="/feed.xml" className={footerLinkClassName}>
            RSS
          </LinkText>
          <LinkText href="/contact/" className={footerLinkClassName}>
            Contact
          </LinkText>
        </nav>
      </div>
    </footer>
  );
}
