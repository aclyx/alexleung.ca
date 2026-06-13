---
name: site-taste-audit
description: Review alexleung.ca for style, tone, typography, color, visual assets, layout balance, mobile/desktop density, tap targets, and performance through Alex Leung's concrete, understated, utility-minded taste profile. Use when asked to critique the site, audit visual design, review copy tone, evaluate mobile and desktop presentation, or propose high-signal taste/style improvements.
---

# Site Taste Audit

## Profile

Use this profile as the governing taste model:

- Concrete, understated, utility-minded, and quietly polished.
- Direct labels and specific nouns over metaphors, slogans, or abstract positioning.
- Calm, balanced layouts that feel intentional on both mobile and desktop.
- Dense but scannable repeat-use surfaces, especially blog indexes, tag lists, and experiment grids.
- Editorial but practical typography: clear hierarchy, comfortable line length, restrained display sizes.
- Warmth through concrete details and useful visual accents, not flourish.
- AI/product language that is first-class but grounded; no hype or future-of-work packaging.

## Workflow

1. Inspect the live surface at desktop and mobile widths. Use the in-app browser when available for localhost or visible browser state.
2. Review the relevant source for copy, typography tokens, layout constraints, color tokens, image assets, and interaction states.
3. Judge the experience against the profile, not against generic portfolio-site trends.
4. Prioritize issues that a visitor would actually feel: imbalance, forced copy, weak hierarchy, cramped or sparse browsing, unclear clickability, poor tap targets, slow or heavy assets, and visual inconsistency.
5. Recommend concrete changes. Prefer small, coherent adjustments over a redesign unless the current structure is the root problem.

## Audit Checklist

- **Tone and Copy**: plain-spoken, specific, modest, and clear. Flag decorative metaphors, inflated positioning, influencer-style framing, broad AI claims, and titles that read like category labels.
- **Layout Balance**: desktop columns, section width, vertical rhythm, alignment, and background framing. Flag surfaces that feel boxed-in, left-heavy, uneven, or artificially constrained.
- **Mobile Density**: blog browsing, tag lists, card height, image prominence, and repeated metadata. Prefer denser scanning without making tap targets uncomfortable.
- **Typography**: semantic text utilities, heading scale, line length, panel text sizing, prose rhythm, and breakpoint behavior.
- **Color and Accent**: restrained palette, legibility over imagery, useful secondary accents, and consistent background treatment. Avoid one-note palettes and decorative effects that dominate content.
- **Visual Assets**: images should reveal the subject, object, state, or gameplay. Flag dark, blurred, overly atmospheric, cropped, or stock-like media when content inspection matters.
- **Interaction**: cards that look clickable should be clickable, tag links should remain distinct, focus/hover states should be visible, and mobile controls should meet comfortable tap-target expectations.
- **Speed and Weight**: image size, responsive variants, lazy/eager loading choices, unnecessary client components, and layout shifts.

## Output

Lead with findings, ordered by impact:

1. `[Px] Finding`
   - Evidence: page, viewport, file path, or observed behavior.
   - Why it matters: connect it to the taste profile and visitor impact.
   - Recommendation: concrete change with scope.

Then include:

- **What already works**: short, specific notes worth preserving.
- **Coherence check**: whether proposed changes work together.
- **Verification gaps**: browser widths, tests, or performance checks not run.
