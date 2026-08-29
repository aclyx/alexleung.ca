import { ElementType, ReactNode } from "react";

import { Subtitle } from "@/components/Subtitle";

type SectionSpacing = "sm" | "md" | "lg";
type SectionAlign = "left" | "center";

type SectionBlockProps<T extends ElementType = "section"> = {
  element?: T;
  title?: string;
  subtitle?: string;
  titleId?: string;
  align?: SectionAlign;
  spacing?: SectionSpacing;
  className?: string;
  children: ReactNode;
};

const spacingClasses: Record<SectionSpacing, string> = {
  sm: "space-y-4",
  md: "space-y-6",
  lg: "space-y-8",
};

const alignClasses: Record<SectionAlign, string> = {
  left: "text-left",
  center: "text-center",
};

export function SectionBlock<T extends ElementType = "section">({
  element,
  title,
  subtitle,
  titleId,
  align = "left",
  spacing = "md",
  className = "",
  children,
}: SectionBlockProps<T>) {
  const Component = element ?? "section";

  return (
    <Component className={`${spacingClasses[spacing]} ${className}`.trim()}>
      {title ? <Subtitle title={title} id={titleId} /> : null}
      {subtitle ? (
        <p className={`text-sm text-muted ${alignClasses[align]}`.trim()}>
          {subtitle}
        </p>
      ) : null}
      <div className={alignClasses[align]}>{children}</div>
    </Component>
  );
}
