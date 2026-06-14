export type PhotoGridItem = {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
  aspectClassName?: string;
  imageClassName?: string;
};

type PhotoGridColumns = "two" | "three";

type PhotoGridProps = {
  photos: readonly PhotoGridItem[];
  columns?: PhotoGridColumns;
  className?: string;
};

const columnClasses: Record<PhotoGridColumns, string> = {
  two: "md:grid-cols-2",
  three: "md:grid-cols-3",
};

export function PhotoGrid({
  photos,
  columns = "three",
  className = "",
}: PhotoGridProps) {
  return (
    <ul className={`grid gap-4 ${columnClasses[columns]} ${className}`.trim()}>
      {photos.map((photo) => {
        const aspectClassName = photo.aspectClassName ?? "aspect-[4/3]";
        const imageClassName = photo.imageClassName ?? "object-center";

        return (
          <li key={photo.src}>
            <figure className="overflow-hidden rounded-lg border border-white/10 bg-slate-950/65">
              <div
                className={`${aspectClassName} overflow-hidden bg-slate-900`}
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  width={photo.width}
                  height={photo.height}
                  sizes={
                    columns === "two"
                      ? "(min-width: 768px) 42vw, 90vw"
                      : "(min-width: 768px) 28vw, 90vw"
                  }
                  loading="lazy"
                  decoding="async"
                  className={`h-full w-full object-cover ${imageClassName}`.trim()}
                />
              </div>
              <figcaption className="border-t border-white/10 px-3 py-2 text-left text-xs font-medium text-gray-300">
                {photo.caption}
              </figcaption>
            </figure>
          </li>
        );
      })}
    </ul>
  );
}
