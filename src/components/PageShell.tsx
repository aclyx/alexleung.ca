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
    <div className={`page-shell py-[var(--header-height)] ${className}`.trim()}>
      {title ? <Title title={title} id={titleId} /> : null}
      {children}
    </div>
  );
}
