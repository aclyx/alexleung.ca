import { ReactNode } from "react";

import {
  ContainerVariant,
  ResponsiveContainer,
} from "@/components/ResponsiveContainer";
import { Title } from "@/components/Title";

export type PageHeaderRail = ContainerVariant;

type PageHeaderProps = {
  title: string;
  titleId?: string;
  eyebrow?: ReactNode;
  description?: ReactNode;
  metadata?: ReactNode;
  rail?: PageHeaderRail;
  className?: string;
};

export function PageHeader({
  title,
  titleId,
  eyebrow,
  description,
  metadata,
  rail = "content",
  className = "",
}: PageHeaderProps) {
  return (
    <ResponsiveContainer element="header" variant={rail} className={className}>
      <div className="max-w-4xl">
        {eyebrow ? <p className="text-eyebrow mb-3">{eyebrow}</p> : null}
        <Title title={title} id={titleId} />
        {description ? (
          <p className="text-body-lg mt-4 max-w-2xl leading-relaxed text-muted">
            {description}
          </p>
        ) : null}
        {metadata ? (
          <div className="text-body-sm mt-4 text-muted">{metadata}</div>
        ) : null}
      </div>
    </ResponsiveContainer>
  );
}
