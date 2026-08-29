type TitleProps = {
  title: string;
  id?: string;
};

export function Title({ title, id }: TitleProps) {
  return (
    <div className="section-center mb-12 md:mb-16">
      <h1
        id={id}
        className="max-w-4xl text-4xl font-bold tracking-[-0.045em] text-ink md:text-5xl"
      >
        {title}
      </h1>
    </div>
  );
}
