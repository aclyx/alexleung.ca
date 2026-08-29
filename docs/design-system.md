# Design System

This guide records the durable interface rules for alexleung.ca. The source of
truth remains [`tailwind.config.mjs`](../tailwind.config.mjs),
[`src/app/globals.css`](../src/app/globals.css), and the shared components under
[`src/components/`](../src/components/).

## Direction

The site should feel calm, specific, and quietly polished. Use the hierarchy,
spacing, and content itself to create interest. Avoid decorative effects,
oversized marketing treatments, and new visual languages that compete with the
writing or experience sections.

## Color

The interface is light-only and uses a warm neutral palette:

| Token                   | Value     | Use                                           |
| ----------------------- | --------- | --------------------------------------------- |
| `paper`                 | `#f4f1e9` | Page and focus-ring offset background         |
| `surface`               | `#fbfaf6` | Cards, forms, and contained controls          |
| `ink`                   | `#20231f` | Primary text and dark code surfaces           |
| `muted`                 | `#62675f` | Supporting copy and metadata                  |
| `line`                  | `#d8d2c6` | Dividers, borders, and quiet underlines       |
| `accent.link`           | `#52634d` | Links, active states, and restrained emphasis |
| `accent.link-hover`     | `#3f4d3b` | Link and primary-action hover states          |
| `accent.secondary-soft` | `#e2e6dd` | Selected, hover, and chip backgrounds         |

Use semantic tokens instead of raw color values. Accent colors should help with
orientation and interaction; they should not become large decorative fields.

## Typography

The site uses Tailwind's system sans-serif stack. Prefer the semantic utilities
defined in `globals.css` for recurring roles:

- `text-body-sm`: `text-sm md:text-base`
- `text-body`: `text-base`
- `text-body-lg`: `text-lg md:text-xl`
- `text-heading-sm`: `text-lg md:text-xl`
- `text-heading`: `text-xl md:text-2xl`
- `text-hero-subtitle`: `text-sm md:text-base`
- `text-hero-title`: `text-4xl md:text-5xl lg:text-6xl`
- `text-hero-description`: `text-lg md:text-xl lg:text-2xl`

Use `Title` for ordinary page `h1` headings, `Subtitle` for reusable section
headings, and `ProseContent` for rendered long-form content. `ProseContent`
defaults to base sizing; use `size="sm"` for notes and `size="lg"` for article
bodies that should scale at `md` and above. Keep display typography out of
compact cards and utility panels.

## Layout And Spacing

- The fixed header height is `4.25rem` (`--header-height`).
- `.section-center` is the standard content container: full width, `1120px`
  maximum, with `px-5 sm:px-6 lg:px-8` gutters.
- `ResponsiveContainer` uses `.section-center` for both `content` and `wide`.
  Its `prose` variant is `max-w-3xl` with mobile and small-screen gutters.
- `PageShell` accounts for the fixed header and supplies standard page padding:
  three additional rem at the top on mobile, four at `md`, and larger bottom
  space at `md`.
- `SectionBlock` supplies `space-y-4`, `space-y-6`, or `space-y-8` through its
  `sm`, `md`, and `lg` spacing options.
- Homepage sections use border dividers and `py-16 md:py-24`. Preserve that
  rhythm unless the content density requires a deliberate exception.

Prefer open sections and dividers over wrapping every region in a card. At each
breakpoint, check line length and column balance rather than preserving a
desktop composition mechanically.

## Surfaces And Controls

`Surface` is the shared card primitive:

- Static surfaces use `border-line bg-surface rounded-xl border shadow-sm`.
- Interactive surfaces add a restrained border, background, shadow, and
  `-translate-y-0.5` hover response plus an accent focus ring.
- Padding belongs in the component's `padding` prop when one of the standard
  `sm`, `md`, or `lg` options fits.

Use `CTAButton` for prominent route actions, `Chip` for pill-shaped labels,
`Tag` for topic links, and `Badge` for semantic status. Cards that look
clickable must make the full surface keyboard and pointer accessible. Hover and
pressed states must not resize controls or reflow nearby content.

Radii should reflect scale: `rounded-md` for compact controls, `rounded-lg` for
buttons and smaller media, `rounded-xl` for surfaces, and `rounded-full` only
for chips or circular controls. Use subtle shadows; the portrait's larger soft
shadow is an intentional focal treatment rather than the default for content.

## Motion

Motion should clarify entry or interaction without asking for attention:

- Keep transitions short, normally `150–200ms`.
- The hero uses one restrained upward fade, with a small delay on the portrait.
- Experience rails may reveal with the scroll timeline when the browser
  supports it.
- Arrow links can translate a few pixels on hover or focus.
- Avoid looping, parallax, or layout-shifting animation.

The global reduced-motion rule removes nonessential animation and smooth
scrolling. New motion must work with `prefers-reduced-motion` and must not be
required to understand state.

## Responsive Behavior

Tailwind's default breakpoints are in use. Mobile is the baseline; `md`
(`768px`) is the main navigation and multi-column transition.

- The desktop navigation appears at `md`; smaller screens use the drawer.
- The homepage hero, experience, and interests layouts collapse to readable
  single-column flows on smaller screens.
- Blog cards may use compact image-and-copy rows on mobile, then expand at
  `md`.
- Mobile controls and links should provide a 44px target. Compact chips may
  reduce their minimum height only at `md` and above.
- Verify copy wrapping, overflow, and visual balance at both mobile and desktop
  widths whenever typography or breakpoint-sensitive layout changes.

## Accessibility

- Keep one visible `h1` per route and preserve a logical heading order.
- Use `aria-current` for active navigation and expose menu state with
  `aria-expanded` and `aria-controls`.
- The mobile menu must support Escape, close after navigation, and restore
  focus when dismissed from its control.
- Keyboard focus must remain clearly visible with the accent ring and the
  appropriate `paper` or `surface` offset.
- Icon-only controls need accessible labels; form fields need associated
  labels; meaningful images need specific alt text.
- Do not communicate state through color alone or hide essential information
  behind hover.
- Avoid horizontal scrolling at common mobile widths.

## Route And Asset Boundaries

Experiments are retired and are not part of the active interface system. The
static files under `public/about/` and `public/experimental/` are intentional,
noindex legacy bridges for old URLs, not page templates to extend.

Add source images under `public/assets/`, prefer metadata-stripped WebP, and run
the repository image-variant workflow so generated variants and the manifest
remain synchronized.
