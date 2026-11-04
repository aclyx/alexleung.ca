import { ResponsiveImage } from "@/components/ResponsiveImage";

type CoverImageProps = {
  src: string;
  srcSet?: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
};

export function CoverImage({
  src,
  srcSet,
  alt,
  sizes,
  className = "",
  priority = false,
}: CoverImageProps) {
  return (
    <div className={`overflow-hidden rounded-lg ${className}`.trim()}>
      <ResponsiveImage
        src={src}
        srcSet={srcSet}
        alt={alt}
        width={1200}
        height={630}
        sizes={sizes}
        pictureClassName="block w-full"
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding={priority ? "sync" : "async"}
        className="aspect-[16/9] w-full object-cover object-center"
      />
    </div>
  );
}
