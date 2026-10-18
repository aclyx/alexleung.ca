# Architecture & SEO Status (2026-08-29)

This is the canonical status document for technical architecture and SEO.

## Executive Summary

The site is in a healthy state for a static, content-first portfolio:

- Next.js static export architecture is stable and well-suited to GitHub Pages.
- Markdown rendering and front matter validation enforce stronger content safety and consistency.
- SEO fundamentals (canonical handling, metadata helpers, JSON-LD, sitemap, robots) are implemented.
- The consolidated profile, writing archive, tag routes, Now page, and standalone Mandelbrot Explorer remain crawlable, while retired routes resolve through static bridges.
- Ongoing work is primarily publishing, internal linking, and periodic search-performance review.

## Architecture Status

### Current Baseline

- **Framework**: Next.js 16 + React 19 + TypeScript
- **Deployment model**: static export (`output: 'export'`) with GitHub Pages-compatible routing
- **Content model**: Markdown posts parsed at build time with zod front matter validation
- **Quality gates**: lint, tests, typecheck, build, and explicit image variant generation in CI and local build scripts

### Completed Improvements

- Markdown pipeline applies sanitization.
- Front matter is validated through a strict schema.
- TypeScript checking is first-class (`yarn typecheck`).
- Shared SEO/URL and JSON-LD builders are centralized and reused by routes.
- Lighthouse CI assertions run against static export routes.

### Next Opportunity

1. **Operational consistency**
   - Keep architecture snapshots short and update only when meaningful framework or pipeline changes land.

## SEO Status

### Implemented Baseline

- Consistent metadata defaults and canonical URL generation.
- Route-level metadata generation.
- Structured data coverage for person/site/pages/blog surfaces.
- `sitemap` and `robots` routes for crawler discoverability.
- The exported 404 page emits one `noindex` directive and no homepage canonical.
- A consolidated profile at `/`, with static redirect bridges for the retired
  About page, experiment hub, load-flow solver, and PID simulator.
- A standalone Mandelbrot Explorer at its established
  `/experimental/mandelbrot/` URL, linked from its accompanying essay.
- Crawlable blog tag archives, with tag links that now contribute to internal linking.

### Next Opportunities

1. **Editorial freshness process**
   - Add or refresh high-intent posts and periodically update evergreen pages.
2. **Internal link depth**
   - Add contextual links between semantically related posts/pages.
3. **Lightweight SEO operations**
   - Periodically review indexing, CTR/impression trends, and broken links.
4. **Page-specific social preview images**
   - Create dedicated OG/Twitter images for high-value landing pages that still fall back to text-only share cards.

## Maintenance Rules

- Keep this file concise and status-driven.
- Update after major architecture, metadata/schema, or information-architecture changes.
- Avoid speculative long-range planning here; capture only active, decision-relevant items.
