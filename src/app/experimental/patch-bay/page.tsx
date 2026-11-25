import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import type { Viewport } from "next";

import { buildPageMetadata } from "@/lib/seo";

import { PatchBay } from "./PatchBay";

export const metadata = buildPageMetadata({
  path: "/experimental/patch-bay/",
  title: "Patch Bay | Alex Leung",
  description:
    "Play the Windows Chip’s Challenge campaign on a circuit-board puzzle console with keyboard or touch controls.",
  images: [
    {
      url: "/assets/patch-bay/share.webp",
      width: 1200,
      height: 630,
      alt: "Patch Bay console showing the orange robot, chips, and colored keys in Lesson 1 of Chip’s Challenge.",
    },
  ],
});
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#252920",
};
export default async function Page() {
  const atlasPath = "/assets/patch-bay/tiles.webp";
  const atlas = await readFile(path.join(process.cwd(), "public", atlasPath));
  const revision = createHash("sha256")
    .update(atlas)
    .digest("hex")
    .slice(0, 12);
  return <PatchBay atlasUrl={`${atlasPath}?v=${revision}`} />;
}
