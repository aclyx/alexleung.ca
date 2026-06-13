import { ElementType, ReactNode } from "react";

type ChipProps<T extends ElementType = "span"> = {
  element?: T;
  children: ReactNode;
  className?: string;
};

const chipBaseClassName =
  "inline-flex min-h-8 items-center rounded-full border px-3 py-1.5 text-xs font-semibold";

export function chipClassName(className = "") {
  return `${chipBaseClassName} ${className}`.trim();
}

export function Chip<T extends ElementType = "span">({
  element,
  children,
  className = "",
}: ChipProps<T>) {
  const Component = element ?? "span";

  return <Component className={chipClassName(className)}>{children}</Component>;
}
