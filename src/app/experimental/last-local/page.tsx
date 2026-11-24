import type { Viewport } from "next";

import { buildPageMetadata } from "@/lib/seo";

import { LastLocal } from "./LastLocal";

export const metadata = buildPageMetadata({
  path: "/experimental/last-local/",
  title: "Last Local | Alex Leung",
  description:
    "Play the 100 boards of the original ClockWerx campaign at a night railway signal desk. Hold a key or touch the brass console to catch the next peg.",
  images: [
    {
      url: "/assets/kickturn/last-local.webp",
      width: 1448,
      height: 1086,
      alt: "A station operator watches the last train arrive beside a green signal desk.",
    },
  ],
});
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#131a20",
  colorScheme: "dark",
};
export default function Page() {
  return <LastLocal />;
}
