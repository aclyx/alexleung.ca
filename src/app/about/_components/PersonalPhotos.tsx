import { PhotoGrid, type PhotoGridItem } from "@/components/PhotoGrid";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { SectionBlock } from "@/components/SectionBlock";

const personalPhotos: readonly PhotoGridItem[] = [
  {
    src: "/assets/site-photos/lake-louise-reflection.webp",
    alt: "Lake Louise at sunrise with mountains reflected on the water",
    caption: "Lake Louise, early morning",
    width: 1400,
    height: 1867,
  },
  {
    src: "/assets/site-photos/twin-peaks-view.webp",
    alt: "San Francisco skyline viewed from Twin Peaks on a clear afternoon",
    caption: "Twin Peaks, San Francisco",
    width: 1400,
    height: 1050,
  },
  {
    src: "/assets/site-photos/chengdu-street.webp",
    alt: "Street-side restaurant scene in Chengdu at night",
    caption: "Chengdu, evening",
    width: 1400,
    height: 1050,
  },
];

export function PersonalPhotos() {
  return (
    <ResponsiveContainer element="section">
      <SectionBlock title="Outside Work" titleId="outside-work" spacing="lg">
        <PhotoGrid photos={personalPhotos} className="items-start" />
      </SectionBlock>
    </ResponsiveContainer>
  );
}
