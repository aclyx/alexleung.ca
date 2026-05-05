import Link from "next/link";

import ExternalLink from "@/components/ExternalLink";
import { IconTextRow } from "@/components/IconTextRow";
import { NowSnapshot, NowTextSegment } from "@/lib/nowTimeline";

type NowSnapshotContentProps = {
  snapshot: NowSnapshot;
  className?: string;
  compact?: boolean;
  headingLevel?: "h2" | "h3" | "h4";
};

function isExternalHref(href: string) {
  return /^https?:\/\//.test(href);
}

function shouldInsertSpace(
  previousSegment: NowTextSegment | undefined,
  segment: NowTextSegment
) {
  if (!previousSegment) {
    return false;
  }

  const previousText = previousSegment.text;
  const text = segment.text;
  if (!previousText || !text) {
    return false;
  }

  const previousLast = previousText.at(-1) ?? "";
  const nextFirst = text.at(0) ?? "";
  return !/\s/.test(previousLast) && !/[\s.,!?;:)]/.test(nextFirst);
}

function renderSegment(
  segment: NowTextSegment,
  index: number,
  segments: NowTextSegment[]
) {
  const content = segment.emphasis ? <em>{segment.text}</em> : segment.text;
  const prefix = shouldInsertSpace(segments[index - 1], segment) ? " " : "";

  if (!segment.href) {
    return (
      <span key={index}>
        {prefix}
        {content}
      </span>
    );
  }

  if (isExternalHref(segment.href)) {
    return [
      prefix ? <span key={`${index}-space`}>{prefix}</span> : null,
      <ExternalLink key={index} href={segment.href}>
        {content}
      </ExternalLink>,
    ];
  }

  return [
    prefix ? <span key={`${index}-space`}>{prefix}</span> : null,
    <Link
      key={index}
      href={segment.href}
      className="text-accent-link transition-colors hover:text-accent-link-hover"
    >
      {content}
    </Link>,
  ];
}

function renderSegments(segments: NowTextSegment[]) {
  return segments.map(renderSegment);
}

export function NowSnapshotContent({
  snapshot,
  className = "",
  compact = false,
  headingLevel = "h2",
}: NowSnapshotContentProps) {
  return (
    <div
      className={`${
        compact ? "text-body-sm space-y-5" : "text-body space-y-8"
      } text-left leading-relaxed ${className}`.trim()}
    >
      {snapshot.sections.map((section) => (
        <IconTextRow
          key={section.id}
          icon={section.icon}
          title={section.title}
          headingLevel={headingLevel}
        >
          {section.blocks.map((block) => {
            if (block.type === "paragraph") {
              return <p key={block.id}>{renderSegments(block.segments)}</p>;
            }

            return (
              <ul
                key={block.id}
                className="list-outside list-disc space-y-1 pl-6"
              >
                {block.items.map((item) => (
                  <li key={item.id}>{renderSegments(item.segments)}</li>
                ))}
              </ul>
            );
          })}
        </IconTextRow>
      ))}
    </div>
  );
}
