import { ReactNode } from "react";

const inlineCodePattern = /`([^`\n]+)`/g;

type ExcerptTextProps = {
  text: string;
};

export function ExcerptText({ text }: ExcerptTextProps) {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match = inlineCodePattern.exec(text);

  while (match) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    nodes.push(
      <code
        key={`excerpt-code-${match.index}`}
        className="rounded bg-accent-secondary-soft px-1 py-0.5 font-mono text-[0.92em] text-ink"
      >
        {match[1]}
      </code>
    );

    lastIndex = match.index + match[0].length;
    match = inlineCodePattern.exec(text);
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return <>{nodes.length > 0 ? nodes : text}</>;
}
