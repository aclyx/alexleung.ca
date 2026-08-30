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
| `ink`                   | `#20231f` | Primary text                                  |
| `muted`                 | `#62675f` | Supporting copy and metadata                  |
| `line`                  | `#d8d2c6` | Dividers, card borders, and quiet underlines  |
| `control-border`        | `#918c82` | Visible boundaries for controls and inputs    |
| `canvas`                | `#030712` | Dark rendering areas such as the Mandelbrot   |
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
- `text-eyebrow`: small uppercase context label with restrained tracking
- `text-page-title`: `text-4xl md:text-5xl` with the page-title weight and
  tracking
- `text-section-title`: `text-3xl md:text-4xl` with the section-title weight and
  tracking
- `text-hero-subtitle`: `text-sm md:text-base`
- `text-hero-title`: `text-4xl md:text-5xl lg:text-6xl`
- `text-hero-description`: `text-lg md:text-xl lg:text-2xl`

`Title` is the page-title `h1`. `PageHeader` composes it with optional eyebrow,
description, and metadata content on either content or prose rails. `PageShell`
uses that header when its `title` prop is present. `SectionHeading` is the
standard eyebrow-and-`h2` pair for major page sections; use `Subtitle` for a
standalone `h2` without an eyebrow. Do not recreate these combinations at each
call site.

Use `ProseContent` for rendered long-form content. It defaults to base sizing;
use `size="sm"` for notes and `size="lg"` for article bodies that should scale at
`md` and above. Keep display typography out of compact cards and utility
panels.

## Layout And Spacing

- The fixed header height is `4.25rem` (`--header-height`).
- `.section-center` is the standard content container: full width, `1120px`
  maximum, with `px-5 sm:px-6 lg:px-8` gutters.
- `ResponsiveContainer` has two explicit rails. `content` uses
  `.section-center`; `prose` uses `max-w-3xl` with mobile and small-screen
  gutters. There is no separate `wide` variant.
- `PageShell` accounts for the fixed header and supplies standard page padding:
  three additional rem at the top on mobile, four at `md`, and larger bottom
  space at `md`.
- When `PageShell` renders a title, it delegates to `PageHeader` and applies the
  standard gap before the body. Use `headerRail="prose"` for article-shaped
  pages and the default content rail elsewhere.
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
  `sm`, `md`, or `lg` options fits. Use `responsive` for `p-5 sm:p-6 md:p-8` on
  content surfaces that need to breathe more as the viewport grows.

Use `actionClassNames` for links and buttons that share control styling. It
provides `primary`, `secondary`, and `quiet` variants in `sm` and `md` sizes,
including a stable 44px minimum height, shared focus treatment, disabled state,
and a one-pixel pressed response. Use `fieldClassNames` for text inputs and
selects so border, focus, disabled, and minimum-height behavior stay aligned.
Use `control-border`, rather than the quieter divider token, where a control
boundary needs to be easy to find.

For native `details` disclosures, compose `disclosureSummaryClassNames` with
`DisclosureIndicator`. This preserves the same target size and focus treatment,
hides the browser-specific marker, and rotates one shared indicator when open.

Use `Chip` for pill-shaped labels, `Tag` for topic links, and `Badge` for
semantic status. Cards that look clickable must make the full surface keyboard
and pointer accessible. Hover, focus, pressed, loading, and feedback states must
not resize controls or reflow nearby content.

Radii should reflect scale: `rounded-md` for compact controls, `rounded-lg` for
buttons and smaller media, `rounded-xl` for surfaces, and `rounded-full` only
for chips or circular controls. Use subtle shadows; the portrait's larger soft
shadow is an intentional focal treatment rather than the default for content.

## Motion

Motion should clarify entry or interaction without asking for attention:

- Use `150ms` for simple field-border and feedback fades, `160ms` for small
  revealed items, and `200ms` for controls, navigation, cards, arrows, and
  disclosure indicators.
- Use the shared `ease-expo-out` curve (`cubic-bezier(0.16, 1, 0.3, 1)`) for
  spatial and interactive motion. The experience rail remains linear because it
  is tied directly to scroll progress.
- The hero copy uses one `360ms`, six-pixel upward fade. The portrait renders
  immediately so the primary visual and layout do not wait on animation.
- Experience rails may reveal with the scroll timeline when the browser
  supports it.
- Newly revealed topic links may use the short `topic-enter` fade and rise.
- Arrow links translate a few pixels on both hover and keyboard focus. Cards
  and other composite interactions should provide the same visual hierarchy for
  `focus-visible`/`focus-within` that they provide on hover.
- Animate the property that changes (`translate`, `rotate`, opacity, or color)
  instead of relying on a generic `transform` transition.
- Avoid looping, parallax, or layout-shifting animation.

The global reduced-motion rule removes nonessential animation and smooth
scrolling. It sets both animation and transition durations **and delays** to
zero so delayed content never remains hidden, and limits animation iteration to
one. New motion must work with `prefers-reduced-motion` and must not be required
to understand state.

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
- Keep the skip link's `#main-content` target intact when changing the root
  layout.
- Use `aria-current` for active navigation and expose menu state with
  `aria-expanded` and `aria-controls`.
- The mobile menu must support Escape, close after navigation, and restore
  focus when dismissed from its control.
- Keyboard focus must remain clearly visible with the accent ring and the
  appropriate `paper` or `surface` offset. If hover changes elevation, color,
  an image, or an arrow, provide an equivalent focus state without layout
  shift.
- Icon-only controls need accessible labels; form fields need associated
  labels; meaningful images need specific alt text.
- Do not communicate state through color alone or hide essential information
  behind hover.
- Avoid horizontal scrolling at common mobile widths.

## Route And Asset Boundaries

The Mandelbrot Explorer is the only active route in the former experiment
namespace. It uses the shared warm interface tokens around its dark rendering
canvas and remains a standalone tool rather than a navigation category or hub.
The static files under `public/about/` and the remaining retired routes under
`public/experimental/` are intentional noindex bridges, not page templates to
extend.

Add source images under `public/assets/`, prefer metadata-stripped WebP, and run
the repository image-variant workflow so generated variants and the manifest
remain synchronized.
