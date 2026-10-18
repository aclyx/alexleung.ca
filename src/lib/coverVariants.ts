import {
  getCoverVariantProfile,
  getImageVariantSourceSet,
  getLargestImageVariant,
  type VariantInfo,
} from "@/lib/imageVariantManifest";

type CoverVariant = "card" | "hero";

export function getCoverVariantSourceSet(
  src: string | undefined,
  variant: CoverVariant
): string | undefined {
  const variantNames = getCoverVariantProfile(variant);
  return getImageVariantSourceSet(src, variantNames);
}

export function getCoverVariantPath(
  src: string | undefined,
  variant: CoverVariant
): string | undefined {
  return getCoverVariant(src, variant)?.path;
}

export function getCoverVariant(
  src: string | undefined,
  variant: CoverVariant
): VariantInfo | undefined {
  return getLargestImageVariant(src, getCoverVariantProfile(variant));
}
