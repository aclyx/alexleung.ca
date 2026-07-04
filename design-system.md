# Design System

This guide documents the current alexleung.ca interface so future UI changes
stay concrete, understated, and consistent with the live site.

## Color Tokens

Primary tokens live in [tailwind.config.mjs](tailwind.config.mjs) and are used
through Tailwind utility classes.

- `white` `#fff`: primary text on dark surfaces.
- `black` `#2f3640`: legacy dark token. Prefer slate utilities for new dark
  surfaces.
- `hover` `#718093`: legacy hover token. Prefer semantic accent hover tokens
  for new links.
- `highlight` `#00D131`: legacy green accent. Use sparingly.
- `accent.link` `#60a5fa`: primary inline link and text CTA color.
- `accent.link-hover` `#93c5fd`: link hover state.
- `accent.primary` `#2563eb`: primary button gradient end color.
- `accent.primary-hover` `#1d4ed8`: primary button hover gradient end color.
- `accent.secondary` `#f59e0b`: topic chips, divider lines, and restrained
  warm accents.
- `accent.secondary-hover` `#fbbf24`: amber hover state.
- `accent.secondary-soft` `#fde68a`: readable amber text on dark chips.
- `accent.success` `#86efac`: positive status badges.
- `accent.warning` `#fcd34d`: warning status badges.
- `accent.info` `#93c5fd`: informational badges.

Common neutral combinations:

- Page background: fixed photographic background with `bg-slate-950` fallback.
- Global overlay: dark overlay at roughly 85 percent opacity in dark mode.
- App tone layer: `rgba(2, 6, 23, 0.58)`.
- Static surface: `bg-slate-950/75`, `border-white/15`.
- Interactive surface: `bg-slate-950/50`, `border-white/10`, hover to
  `bg-slate-900/70` and `border-accent-secondary/40`.
- Secondary controls: `bg-white/5`, `border-white/20`, hover to `bg-white/10`
  and `border-white/30`.

## Typography Scale

The site uses Lato through `font-lato`. Prefer semantic typography utilities
from [src/app/globals.css](src/app/globals.css) over raw one-off sizes.

- `text-body-sm`: `text-sm`, increasing to `text-base` at `md`.
- `text-body`: `text-base`.
- `text-body-lg`: `text-lg`, increasing to `text-xl` at `md`.
- `text-heading-sm`: `text-lg`, increasing to `text-xl` at `md`.
- `text-heading`: `text-xl`, increasing to `text-2xl` at `md`.
- `text-hero-subtitle`: `text-lg`, increasing to `text-xl` at `lg`.
- `text-hero-title`: `text-4xl`, increasing to `text-7xl` at `md` and
  `text-8xl` at `lg`.
- `text-hero-description`: `text-lg`, increasing to `text-xl` at `md` and
  `text-2xl` at `lg`.

Page title patterns:

- Marketing/home hero: use `text-hero-*` utilities.
- Standard page title: use the `Title` component and `.section-title`.
- Section title: use the `Subtitle` component with divider lines.
- Compact cards and panels: use `text-heading-sm` or `text-heading`, not
  hero-scale type.
- Long-form blog content: use `ProseContent`; use `size="lg"` for post bodies
  and `size="sm"` for notes or footers.

## Spacing Rules

- Header height is `--header-height: 4.5rem`.
- `PageShell` adds vertical padding equal to the header height.
- Default content width is `.section-center`: `90vw` up to `max-w-content`
  (`1170px`), narrowing to `70vw` at `992px` and above.
- Wide browsing surfaces use `ResponsiveContainer variant="wide"`:
  `container mx-auto px-5`.
- Prose pages use `ResponsiveContainer variant="prose"`:
  `container mx-auto max-w-3xl px-5`.
- Section rhythm should use `SectionBlock` spacing:
  - `sm`: `space-y-4`
  - `md`: `space-y-6`
  - `lg`: `space-y-8`
- Top-level repeated sections generally use `space-y-12 md:space-y-14` or
  bottom padding around `pb-12 md:pb-14`.
- Grids should start at `gap-4` for dense browsing surfaces and increase to
  `gap-8` only when cards need more reading space.
- Mobile browsing pages should show useful content in the first viewport.
  Avoid ceremonial intros that push cards below the fold.

## Radius, Border, And Shadow Rules

- Default radius is `rounded-lg` (`8px`) for surfaces, cards, images, inputs,
  and buttons.
- Use `rounded-md` for compact controls.
- Use `rounded-full` only for chips, pills, badges, and circular affordances.
- Default static border is `border-white/15`.
- Default interactive border is `border-white/10`, with hover/focus emphasis
  through color rather than heavier borders.
- Use subtle shadows only:
  - `shadow-sm` for static surfaces.
  - `shadow-lg` on interactive surface hover.
  - `shadow-blue-500/20` only for primary CTA emphasis.
- Do not nest card-like surfaces inside other card-like surfaces unless the
  inner item is a real repeated item, modal, form, or tool panel.

## Component Patterns

- `Header` is fixed, translucent, and 4.5rem tall. Desktop navigation is inline;
  mobile navigation uses a drawer below the header.
- `PageShell` wraps ordinary pages and owns header-offset padding.
- `ResponsiveContainer` owns content width. Avoid local width utilities when an
  existing variant fits.
- `Surface` is the canonical glass panel:
  - `interactive={false}` for static framed content.
  - `interactive` for full-card links and clickable panels.
  - Padding should use the component prop when possible; use local padding only
    when a card has responsive padding needs.
- `Card` is a simple static `Surface` with medium padding.
- `BlogPostCard` is the canonical post card. Use `compactOnMobile` for dense
  blog index browsing.
- `Chip`, `Tag`, and `Badge` are the canonical pill components.
- `CTAButton` is for primary route-level actions. Pair icons with text when the
  action benefits from a recognizable symbol.
- `LatestWritingSection` is the canonical three-post teaser surface.
- `FollowItSubscribeForm` is the canonical newsletter block.
- Experiment pages may use denser tool panels, but they should keep the same
  dark surface, border, and focus-ring language.

## Mobile Breakpoints

Tailwind defaults are in use:

- `sm`: `640px`
- `md`: `768px`
- `lg`: `1024px`
- `xl`: `1280px`
- `2xl`: `1536px`

Current responsive rules to preserve:

- Mobile header shows the menu button below `md`; desktop navigation starts at
  `md`.
- Background image sources switch at `768px` and `1280px`.
- Blog post cards use compact two-column mobile rows and switch to standard
  cards at `md`.
- Mobile topic browsing uses a `details` disclosure to keep the blog index
  scannable.
- Experiment grids use one column on mobile, two at `md`, and three at `xl`.
- Buttons, chips, and form controls should be comfortable on mobile; dense
  desktop chips can be smaller when they are grouped and visually distinct.

## Accessibility Rules

- Keep one visible `h1` per route.
- Preserve `aria-current="page"` on active navigation links.
- Mobile menu controls need `aria-expanded`, `aria-controls`, Escape handling,
  and focus return to the menu button.
- Interactive cards must be keyboard reachable and have visible focus rings.
- Focus rings should use `focus-visible:ring-2 focus-visible:ring-accent-link`
  with `ring-offset-slate-950` on dark backgrounds. Use a white outline on blue
  primary CTAs when the accent ring is too close to the button fill.
- Icon-only controls need an accessible label.
- Images need descriptive alt text. If the image intentionally depicts Alex,
  name Alex in the alt text.
- Form inputs need labels, even when the visible label is screen-reader only.
- Mobile tap targets should be at least 44px tall or have equivalent spacing.
- Do not use color alone to communicate state; pair color with text, position,
  shape, or `aria-current`.
- Avoid horizontal scrolling at common mobile widths.

## Anti-Patterns To Avoid

- Do not introduce a second visual system with light cards, unrelated gradients,
  decorative blobs, or oversized marketing sections.
- Do not use hero-scale type inside cards, sidebars, tool panels, or compact
  browsing surfaces.
- Do not make pages feel boxed-in by wrapping every section in a large card.
- Do not add one-off metaphors or clever labels when a direct noun is clearer.
- Do not make interactive cards look clickable without making the full card
  keyboard and pointer accessible.
- Do not rely on hover-only affordances for important information.
- Do not add layout-shifting hover effects to dense cards, controls, or nav
  items.
- Do not add internal links from older dated posts to later posts unless the
  older post also receives an intentional `updated` date.
- Do not add source images without generating responsive variants and updating
  the image manifest.
- Do not run broad UI restyles when a small consistency fix addresses the
  visitor-visible issue.
