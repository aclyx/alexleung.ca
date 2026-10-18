import { PageShell } from "@/components/PageShell";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { buildPageMetadata } from "@/lib/seo";

import { PlaygroundLinks } from "../_components/PlaygroundLinks";
import { SeamCarver } from "./_components/SeamCarver";

export const metadata = buildPageMetadata({
  title: "Content-aware Resizing | Alex Leung",
  description:
    "Compare three ways to narrow a photograph. Paint over what should stay.",
  path: "/experimental/seam-carving/",
});
export default function Page() {
  return (
    <PageShell
      title="Content-aware Resizing"
      description="Compare three ways to narrow a photograph. Paint over what should stay."
    >
      <ResponsiveContainer>
        <SeamCarver />
        <PlaygroundLinks />
      </ResponsiveContainer>
    </PageShell>
  );
}
