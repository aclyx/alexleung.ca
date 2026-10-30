import Link from "next/link";

import { ResponsiveImage } from "@/components/ResponsiveImage";
import { surfaceClassNames } from "@/components/Surface";
import { BROWSER_TOOLS } from "@/constants/browserTools";

export function BrowserToolGrid() {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
      {BROWSER_TOOLS.map((tool) => (
        <li
          key={tool.id}
          className={tool.featured ? "sm:col-span-2" : undefined}
        >
          <Link
            href={tool.href}
            aria-label={tool.title}
            className={surfaceClassNames({
              interactive: true,
              className: "flex h-full flex-col overflow-hidden",
            })}
          >
            <ResponsiveImage
              src={tool.image.src}
              alt=""
              width={tool.image.width}
              height={tool.image.height}
              sizes={
                tool.featured
                  ? "(min-width: 1120px) 720px, calc(100vw - 2.5rem)"
                  : "(min-width: 1120px) 352px, (min-width: 640px) 50vw, calc(100vw - 2.5rem)"
              }
              loading="lazy"
              decoding="async"
              pictureClassName="block border-b border-line bg-surface"
              className={`w-full ${tool.featured ? "aspect-[2/1] object-contain p-3 md:aspect-auto md:h-64" : "aspect-[2/1] object-cover"}`}
            />
            <span className="flex flex-col gap-1.5 px-4 pb-5 pt-4 md:px-5">
              <span className="font-mono text-xs uppercase tracking-wide text-muted">
                {tool.field}
              </span>
              <span className="text-heading-sm text-ink">{tool.title}</span>
              <span className="text-body-sm leading-relaxed text-muted">
                {tool.description}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
