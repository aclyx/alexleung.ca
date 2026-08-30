import { ReactNode } from "react";

import { PageHeader, PageHeaderRail } from "@/components/PageHeader";

type PageShellProps = {
  children: ReactNode;
  title?: string;
  titleId?: string;
  eyebrow?: ReactNode;
  description?: ReactNode;
  metadata?: ReactNode;
  headerRail?: PageHeaderRail;
  className?: string;
};

export function PageShell({
  children,
  title,
  titleId,
  eyebrow,
  description,
  metadata,
  headerRail = "content",
  className = "",
}: PageShellProps) {
  return (
    <div
      className={`page-shell pb-16 pt-[calc(var(--header-height)+3rem)] md:pb-24 md:pt-[calc(var(--header-height)+4rem)] ${className}`.trim()}
    >
      {title ? (
        <PageHeader
          title={title}
          titleId={titleId}
          eyebrow={eyebrow}
          description={description}
          metadata={metadata}
          rail={headerRail}
          className="mb-12 md:mb-16"
        />
      ) : null}
      {children}
    </div>
  );
}
