type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  titleId?: string;
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  titleId,
  className = "",
}: SectionHeadingProps) {
  return (
    <div className={className}>
      <p className="text-eyebrow">{eyebrow}</p>
      <h2 id={titleId} className="text-section-title mt-3">
        {title}
      </h2>
    </div>
  );
}
