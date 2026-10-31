import { PageShell } from "@/components/PageShell";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { getBrowserToolShareImages } from "@/constants/browserTools";
import { buildPageMetadata } from "@/lib/seo";

import { PlaygroundLinks } from "../_components/PlaygroundLinks";
import { RayWorkbench } from "./_components/RayWorkbench";

export const metadata = buildPageMetadata({
  title: "Ray-tracing Room | Alex Leung",
  description:
    "Move the light. Inspect the paths behind reflections, shadows, and color.",
  path: "/experimental/ray-tracing/",
  images: getBrowserToolShareImages("ray-tracing"),
});
export default function Page() {
  return (
    <PageShell
      title="Ray-tracing Room"
      description="Move the light. Inspect the paths behind reflections, shadows, and color."
    >
      <ResponsiveContainer>
        <RayWorkbench />
        <PlaygroundLinks />
      </ResponsiveContainer>
    </PageShell>
  );
}
