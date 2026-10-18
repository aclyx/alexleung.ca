import Link from "next/link";

export function PlaygroundLinks() {
  return (
    <nav
      aria-label="More playgrounds"
      className="mt-12 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-5 text-sm"
    >
      <Link
        className="inline-flex min-h-11 items-center underline underline-offset-4"
        href="/experimental/ray-tracing/"
      >
        Ray tracing
      </Link>
      <Link
        className="inline-flex min-h-11 items-center underline underline-offset-4"
        href="/experimental/seam-carving/"
      >
        Content-aware resizing
      </Link>
    </nav>
  );
}
