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
  // Local development can use a private copy. Never embed installation media in a static export.
  let localCampaign = "";
  if (process.env.NODE_ENV === "development") {
    try {
      localCampaign = await readFile(
        path.join(process.cwd(), ".cache/patch-bay/CHIPS.DAT"),
        "base64"
      );
    } catch {}
  }
  return (
    <PatchBay
      localCampaign={localCampaign}
      atlasUrl={`${atlasPath}?v=${revision}`}
    />
  );
}
