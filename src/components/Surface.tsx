import { ElementType, ReactNode } from "react";

type SurfacePadding = "none" | "sm" | "md" | "lg" | "responsive";

type SurfaceProps<T extends ElementType = "div"> = {
  element?: T;
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  padding?: SurfacePadding;
};

const paddingClasses: Record<SurfacePadding, string> = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
  responsive: "p-5 sm:p-6 md:p-8",
};

export function surfaceClassNames({
  interactive = false,
  padding = "none",
  className = "",
}: {
  interactive?: boolean;
  padding?: SurfacePadding;
  className?: string;
}) {
  const baseClass = interactive ? "surface-interactive" : "surface-static";
  return `${baseClass} ${paddingClasses[padding]} ${className}`.trim();
}

export function Surface<T extends ElementType = "div">({
  element,
  children,
  className = "",
  interactive = false,
  padding = "none",
}: SurfaceProps<T>) {
  const Component = element ?? "div";

  return (
    <Component
      className={surfaceClassNames({ interactive, padding, className })}
    >
      {children}
    </Component>
  );
}
