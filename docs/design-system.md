# Design System

This guide records the durable interface rules for alexleung.ca. The source of
truth remains [`tailwind.config.mjs`](../tailwind.config.mjs),
[`src/app/globals.css`](../src/app/globals.css), and the shared components under
[`src/components/`](../src/components/).

## Direction

The site is a personal homepage and writing archive. Let the writing, a current
reading note, and occasional photographs carry its character. Use Georgia for
page titles and editorial headings, a system sans-serif for body copy, and quiet
rules to separate sections. Keep work history compact and navigation visible.
Avoid giving every subject the same card, illustration, or introductory label.

## Shared Content

Edit `NOW_CONTENT.entries` and `NOW_CONTENT.updatedAt` in
[`src/constants/now.tsx`](../src/constants/now.tsx) to update both Home and Now.
The homepage previews the first entry; Now renders all entries. Keep the update
date tied to content changes. `WritingList` receives post titles and excerpts
from blog frontmatter, so they stay consistent across the homepage and archive.
Contact and the shared footer use profile URLs from
[`src/constants/socialLinks.tsx`](../src/constants/socialLinks.tsx).

## Color

The interface is light-only and uses a warm neutral palette:

| Token                   | Value     | Use                                           |
| ----------------------- | --------- | --------------------------------------------- |
| `paper`                 | `#faf9f5` | Page and focus-ring offset background         |
| `surface`               | `#ffffff` | Cards, forms, and contained controls          |
| `ink`                   | `#202936` | Primary text                                  |
| `muted`                 | `#58616d` | Supporting copy and metadata                  |
| `line`                  | `#d3d5d5` | Dividers, card borders, and quiet underlines  |
| `control-border`        | `#858c95` | Visible boundaries for controls and inputs    |
| `canvas`                | `#030712` | Dark rendering areas such as the Mandelbrot   |
| `accent.link`           | `#285296` | Links, active states, and restrained emphasis |
| `accent.link-hover`     | `#1d3d72` | Link and primary-action hover states          |
| `accent.secondary-soft` | `#e8edf4` | Selected, hover, and chip backgrounds         |

Use semantic tokens instead of raw color values. Accent colors should help with
orientation and interaction; they should not become large decorative fields.
On a dark `canvas` surface, a `paper` focus ring is the intentional inverse-
surface exception so keyboard focus retains strong contrast.

## Typography

The site pairs Georgia with Tailwind's system sans-serif stack. Dates and the
domain wordmark use the system monospace stack. Prefer the semantic utilities
defined in `globals.css` for recurring roles:

- `text-body-sm`: `text-sm md:text-base`
- `text-body`: `text-base`
- `text-body-lg`: `text-lg md:text-xl`
- `text-heading-sm`: `text-lg md:text-xl`
- `text-heading`: `text-xl md:text-2xl`
- `text-eyebrow`: small uppercase context label with restrained tracking
- `text-page-title`: Georgia, 42px on mobile and 52px at `md`, normal weight,
  tight leading and restrained negative tracking
- `text-editorial-heading`: Georgia, 24px, normal weight, for writing titles
  and reading sections
- `text-editorial-label`: 14px medium-weight sans-serif for short section labels
- `text-section-title`: `text-3xl md:text-4xl` with the section-title weight and
  tracking
- `text-hero-subtitle`: `text-sm md:text-base`
- `text-hero-title`: the same Georgia sizing and weight as `text-page-title`
- `text-hero-description`: `text-lg md:text-xl lg:text-2xl`

`Title` is the page-title `h1`. `PageHeader` composes it with optional eyebrow,
description, and metadata content on either content or prose rails. `PageShell`
uses that header when its `title` prop is present. `SectionHeading` is the
eyebrow-and-`h2` pair when that extra context is useful; use `Subtitle` for a
standalone `h2`. Homepage and writing sections use the simpler editorial heading
or label without a repeated eyebrow.

Use `ProseContent` for rendered long-form content. It defaults to base sizing;
use `size="sm"` for notes and `size="lg"` for article bodies that should scale at
`md` and above. Keep display typography out of compact cards and utility
panels. Blog code blocks intentionally invert the warm palette with an `ink`
background and `paper` text, while inline code remains on the light surface.

## Layout And Spacing

- The header stays in document flow; it does not cover content during scrolling.
- `.section-center` is the standard content container: full width, `1120px`
  maximum, with `px-5 sm:px-6 lg:px-8` gutters.
- `ResponsiveContainer` has two explicit rails. `content` uses
  `.section-center`; `prose` uses `max-w-3xl` with mobile and small-screen
  gutters. There is no separate `wide` variant.
- `PageShell` supplies two rem of top padding on mobile and 2.75rem at `md`,
  with four rem of bottom space on mobile and six rem at `md`.
- When `PageShell` renders a title, it delegates to `PageHeader` and applies the
  standard gap before the body. Use `headerRail="prose"` for article-shaped
  pages and the default content rail elsewhere.
- Homepage sections use border dividers and compact spacing. The introduction
  and selected writing occupy the main column, with a smaller Now preview and
  personal material alongside them at desktop widths.

Prefer open sections and dividers over wrapping every region in a card. At each
breakpoint, check line length and column balance rather than preserving a
desktop composition mechanically.

Contact keeps email, a copy action, and profile links together, with 24px gaps
between sections. The shared subscription form uses a divider and an editorial
heading on Contact, the writing archive, and individual posts. Inputs and actions
stack on mobile and share a row from `sm` upward.

The footer provides GitHub, LinkedIn, X, RSS, and Contact on every page. Keep
these as text links with 44px targets; the name sits above the links on mobile.

Topic archives use one column of divider-separated rows with cover thumbnails,
serif titles, dates, and excerpts. Keep mobile excerpts wide enough to read.
Related posts use compact title-and-date rows within the article's prose rail.
Illustrated post covers remain part of the site; changing the surrounding layout
does not require replacing them.

The 404 page uses the standard page rail, a small status label, and direct Home
and Writing links. The RSS browser view follows the same paper palette and serif
hierarchy, with a selectable feed address and a link back to Writing. Its
stylesheet resolves on the feed's own origin so local previews match production.

## Surfaces And Controls

`Surface` is the shared card primitive:

- Static surfaces use `border-line bg-surface rounded-xl border shadow-sm`.
- Interactive surfaces add a restrained border, background, shadow, and
  `-translate-y-0.5` hover response plus an accent focus ring.
- On coarse pointers, full-card links may use a one-pixel pressed response.
  Keep this feedback off inline links and other reading surfaces.
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
for chips or circular controls. Writing lists and editorial photographs do not
need card surfaces, rounded frames, or shadows.

## Motion

Motion should clarify entry or interaction without asking for attention:

- Use `150ms` for simple field-border and feedback fades, `160ms` for small
  revealed items, and `200ms` for controls, navigation, cards, arrows, and
  disclosure indicators.
- Use the shared `ease-expo-out` curve (`cubic-bezier(0.16, 1, 0.3, 1)`) for
  spatial and interactive motion. Homepage content renders immediately without
  entry animations.
- Newly revealed topic links may use the short `topic-enter` fade and rise,
  staggered by no more than `20ms` per item.
- Blog posts may show a two-pixel reading-progress line from the title through
  the final prose paragraph. It should not include tags, subscription, or
  related-post content, and it should remain hidden when the article is too
  short to produce useful progress.
- State feedback may animate within a stable control label, such as the drawn
  check in the copy-email action. Feedback must not resize the control.
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
(`768px`) is the main multi-column transition.

- Home, Writing, Now, and Contact stay visible at every width. The domain and
  navigation wrap onto two rows only when the available width requires it.
- The homepage columns collapse into a readable single-column flow on smaller
  screens. The Now preview follows the introduction.
- Topic rows pair a small thumbnail with the title and date; excerpts occupy the
  full row on mobile. Related writing stays in one column at every width.
- Mobile controls and links should provide a 44px target. Compact chips may
  reduce their minimum height only at `md` and above.
- Verify copy wrapping, overflow, and visual balance at both mobile and desktop
  widths whenever typography or breakpoint-sensitive layout changes.

## Accessibility

- Keep one visible `h1` per route and preserve a logical heading order.
- Keep the skip link's `#main-content` target intact when changing the root
  layout.
- Use `aria-current` for active navigation. Writing remains active on individual
  posts and topic archives. Navigation links remain in the normal tab order on
  mobile and desktop.
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
