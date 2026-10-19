import { LinkText } from "@/components/LinkText";

export function PlaygroundLinks() {
  return (
    <nav
      aria-label="More playgrounds"
      className="mt-12 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-5 text-sm"
    >
      <LinkText standalone href="/experimental/ray-tracing/">
        Ray tracing
      </LinkText>
      <LinkText standalone href="/experimental/seam-carving/">
        Content-aware resizing
      </LinkText>
    </nav>
  );
}
