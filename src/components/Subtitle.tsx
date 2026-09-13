type SubtitleProps = {
  title: string;
  id?: string;
  className?: string;
};

export function Subtitle({ title, id, className = "" }: SubtitleProps) {
  return (
    <h2
      id={id}
      className={`text-2xl font-bold tracking-[-0.03em] text-ink md:text-3xl ${className}`.trim()}
    >
      {title}
    </h2>
  );
}
