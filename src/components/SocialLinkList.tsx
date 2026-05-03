import { ReactNode } from "react";

import { TrackedSocialLink } from "@/components/TrackedSocialLink";
import { data } from "@/constants/socialLinks";

type SocialLinkListProps = {
  className?: string;
  itemClassName?: string;
  linkClassName?: string;
  labelClassName?: string;
  iconClassName?: string;
  rel?: string;
  showLabel?: boolean;
  analyticsPlacement?: string;
  labelFormatter?: (label: string) => ReactNode;
};

export function SocialLinkList({
  analyticsPlacement = "social_links",
  className,
  itemClassName,
  linkClassName,
  labelClassName,
  iconClassName,
  rel = "me noopener",
  showLabel = false,
  labelFormatter = (label) => label,
}: SocialLinkListProps) {
  return (
    <ul className={className}>
      {data.map((link) => (
        <li key={link.id} className={itemClassName}>
          <TrackedSocialLink
            href={link.url}
            className={linkClassName}
            rel={rel}
            label={link.label}
            analyticsPlacement={analyticsPlacement}
          >
            <span className={iconClassName}>{link.icon}</span>
            {showLabel ? (
              <span className={labelClassName}>
                {labelFormatter(link.label)}
              </span>
            ) : null}
          </TrackedSocialLink>
        </li>
      ))}
    </ul>
  );
}
