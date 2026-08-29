import { ReactNode } from "react";

import { Title } from "@/components/Title";

type PageShellProps = {
  children: ReactNode;
  title?: string;
  titleId?: string;
  className?: string;
};

export function PageShell({
  children,
  title,
  titleId,
  className = "",
}: PageShellProps) {
  return (
    <div
      className={`page-shell pb-16 pt-[calc(var(--header-height)+3rem)] md:pb-24 md:pt-[calc(var(--header-height)+4rem)] ${className}`.trim()}
    >
      {title ? <Title title={title} id={titleId} /> : null}
      {children}
    </div>
  );
}
