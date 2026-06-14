import { PhotoGrid, type PhotoGridItem } from "@/components/PhotoGrid";

const sanFranciscoPhotos: readonly PhotoGridItem[] = [
  {
    src: "/assets/site-photos/twin-peaks-view.webp",
    alt: "San Francisco skyline viewed from Twin Peaks on a clear afternoon",
    caption: "Twin Peaks",
    width: 1400,
    height: 1050,
  },
  {
    src: "/assets/blog/camping-indoors-in-san-francisco/corona-heights-view.webp",
    alt: "San Francisco skyline viewed from Corona Heights Park on a clear afternoon",
    caption: "Corona Heights",
    width: 1600,
    height: 1200,
  },
];

export function SanFranciscoPhotos() {
  return (
    <section aria-labelledby="san-francisco-photos" className="space-y-4">
      <h2
        id="san-francisco-photos"
        className="text-heading-sm font-semibold text-gray-100"
      >
        San Francisco Lately
      </h2>
      <PhotoGrid photos={sanFranciscoPhotos} columns="two" />
    </section>
  );
}
