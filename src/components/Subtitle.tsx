type SubtitleProps = {
  title: string;
  id?: string;
};

export function Subtitle({ title, id }: SubtitleProps) {
  return (
    <div>
      <h2
        id={id}
        className="text-2xl font-bold tracking-[-0.03em] text-ink md:text-3xl"
      >
        {title}
      </h2>
    </div>
  );
}
