import { NowEntryContent } from "@/constants/now";

type NowEntryProps = {
  entry: NowEntryContent;
  headingLevel?: "h2" | "h3";
  className?: string;
  headingClassName?: string;
};

export function NowEntry({
  entry,
  headingLevel: Heading = "h2",
  className = "",
  headingClassName = "text-editorial-heading",
}: NowEntryProps) {
  return (
    <section className={`space-y-3 ${className}`.trim()}>
      <Heading className={headingClassName}>{entry.title}</Heading>
      <div className="space-y-4">{entry.body}</div>
    </section>
  );
}
