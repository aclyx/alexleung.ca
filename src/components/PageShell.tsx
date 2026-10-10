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
      className={`page-shell pt-8 pb-16 md:pt-11 md:pb-24 ${className}`.trim()}
    >
      {title ? (
        <PageHeader
          title={title}
          titleId={titleId}
          eyebrow={eyebrow}
          description={description}
          metadata={metadata}
          rail={headerRail}
          className="mb-8 md:mb-10"
        />
      ) : null}
      {children}
    </div>
  );
}
