import { ReactNode } from "react";

type ProseSize = "sm" | "base" | "lg";

type ProseContentProps = {
  className?: string;
  children?: ReactNode;
  html?: string;
  size?: ProseSize;
};

const proseBaseClasses =
  "prose max-w-none prose-headings:font-bold prose-headings:tracking-[-0.025em] prose-headings:text-ink prose-p:text-ink prose-li:text-ink prose-a:text-accent-link prose-a:underline prose-a:decoration-accent-link/40 prose-a:underline-offset-2 prose-a:transition-colors prose-a:hover:text-accent-link-hover prose-a:hover:decoration-accent-link-hover prose-a:focus-visible:rounded-sm prose-a:focus-visible:outline-none prose-a:focus-visible:ring-2 prose-a:focus-visible:ring-accent-link prose-a:focus-visible:ring-offset-2 prose-a:focus-visible:ring-offset-paper prose-strong:text-ink prose-blockquote:border-accent-link prose-blockquote:text-muted prose-hr:border-line prose-pre:border prose-pre:border-line prose-pre:bg-ink prose-pre:text-paper prose-code:text-ink prose-pre:prose-code:text-paper";

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
