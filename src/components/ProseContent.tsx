import { ReactNode } from "react";

type ProseSize = "sm" | "base" | "lg";

type ProseContentProps = {
  className?: string;
  children?: ReactNode;
  html?: string;
  size?: ProseSize;
};

const proseBaseClasses =
  "prose prose-invert max-w-none prose-headings:text-white prose-p:text-gray-300 prose-a:text-accent-link prose-a:underline prose-a:decoration-accent-link/50 prose-a:transition-colors hover:prose-a:text-accent-link-hover hover:prose-a:decoration-accent-link-hover prose-strong:text-white prose-pre:border prose-pre:border-white/10 prose-pre:bg-black/50";

const proseSizeClasses: Record<ProseSize, string> = {
  sm: "prose-sm md:prose-sm",
  base: "",
  lg: "md:prose-lg",
};

export function ProseContent({
  className = "",
  children,
  html,
  size = "base",
}: ProseContentProps) {
  const proseClasses =
    `${proseBaseClasses} ${proseSizeClasses[size]} ${className}`.trim();

  if (html) {
    return (
      <div
        className={proseClasses}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return <div className={proseClasses}>{children}</div>;
}
