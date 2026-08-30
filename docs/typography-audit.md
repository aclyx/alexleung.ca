# Typography Decisions

Status: current. The broader visual and type scale is documented in
[`design-system.md`](design-system.md); this note preserves the reason for the
explicit prose-sizing API.

## Prose Sizing

`ProseContent` used to enlarge all prose at desktop widths implicitly. That made
small notes and secondary text change hierarchy at `md` without the call site
expressing that intent.

The component now accepts `size: "sm" | "base" | "lg"` and defaults to
`"base"`:

- Omit `size` for ordinary prose.
- Use `size="sm"` for compact notes and footers. It applies `prose-sm` at every
  breakpoint.
- Use `size="lg"` for article bodies that should add `md:prose-lg`.

Keep this choice explicit at the call site instead of overriding prose classes
locally.

## Guardrails

- Prefer the semantic body, heading, and hero utilities in `globals.css` for
  recurring roles before adding one-off sizes.
- Do not use `text-md`; it is not a default Tailwind utility.
- When typography, line length, or breakpoint-sensitive copy changes, inspect
  both mobile and `md+` rendering or run the relevant Playwright coverage.
- Update this note only if the prose-sizing contract changes. Update the design
  system when the broader typography scale or visual hierarchy changes.
