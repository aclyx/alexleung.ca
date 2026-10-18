import { SocialLinkList } from "@/components/SocialLinkList";

export function SocialMediaList() {
  return (
    <nav aria-label="Profiles" className="mt-6">
      <SocialLinkList
        analyticsPlacement="contact_page"
        className="flex flex-wrap gap-x-6"
        itemClassName="list-none"
        linkIds={[1, 2, 4]}
        linkClassName="inline-flex min-h-11 min-w-11 items-center text-accent-link underline decoration-accent-link/40 underline-offset-4 transition-colors hover:text-accent-link-hover focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-link focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        iconClassName="hidden"
        labelClassName="text-body"
        rel="noopener noreferrer me"
        showLabel
        labelFormatter={(label) =>
          label.replace(" Profile", "").replace("X (Twitter)", "X")
        }
      />
    </nav>
  );
}
