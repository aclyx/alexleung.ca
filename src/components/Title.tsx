type TitleProps = {
  title: string;
  id?: string;
  className?: string;
};

export function Title({ title, id, className = "" }: TitleProps) {
  return (
    <h1 id={id} className={`text-page-title ${className}`.trim()}>
      {title}
    </h1>
  );
}
