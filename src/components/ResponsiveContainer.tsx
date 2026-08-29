import { ElementType, ReactNode } from "react";

type ContainerVariant = "content" | "wide" | "prose";

type ResponsiveContainerProps<T extends ElementType = "div"> = {
  element?: T;
  children: ReactNode;
  className?: string;
  variant?: ContainerVariant;
};

const variantClasses: Record<ContainerVariant, string> = {
  content: "section-center",
  wide: "section-center",
  prose: "mx-auto w-full max-w-3xl px-5 sm:px-6",
};

export function ResponsiveContainer<T extends ElementType = "div">({
  element,
  children,
  className = "",
  variant = "content",
}: ResponsiveContainerProps<T>) {
  const Component = element ?? "div";

  return (
    <Component className={`${variantClasses[variant]} ${className}`.trim()}>
      {children}
    </Component>
  );
}
