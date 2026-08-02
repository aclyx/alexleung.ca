import {
  getStaticImageFallback,
  getStaticImageSourceSet,
} from "@/lib/localImageMetadata";

export function NowStatePostcard() {
  const srcSet = getStaticImageSourceSet("nowStatePostcard");
  const fallback = getStaticImageFallback("nowStatePostcard");

  return (
    <figure className="mx-auto max-w-3xl overflow-hidden rounded-lg border border-white/10 bg-slate-950/65">
      <div className="aspect-[3/2] overflow-hidden bg-slate-900">
        <img
          src={fallback.path}
          srcSet={srcSet}
          sizes="(min-width: 992px) 70vw, 90vw"
          alt="Generated still life of a partly unpacked San Francisco apartment table with a laptop, notebook, technical book, tennis equipment, and language cards"
          width={fallback.width}
          height={fallback.height}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      </div>
      <figcaption className="border-t border-white/10 px-3 py-2 text-left text-xs font-medium text-gray-300">
        A generated snapshot of the move, study, and tennis.
      </figcaption>
    </figure>
  );
}
