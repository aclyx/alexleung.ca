# Documentation Directory Guide

This folder contains maintainer-facing documentation that supports implementation, operations, and project memory. Prefer short status/runbook docs for active concerns; keep larger planning artifacts clearly labeled when they are parked or historical.

## Document Index

### Active Status And Runbooks

| File                           | Purpose                                                               | Update cadence                                                        |
| ------------------------------ | --------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `architecture-seo-status.md`   | Status snapshot for technical architecture and SEO                    | After meaningful architecture, metadata, schema, or IA changes        |
| `blog-notification-report.md`  | Notification architecture and operational runbook for new-post alerts | When notification provider, subscribe UX, or feed workflow changes    |
| `codespaces.md`                | Codespaces-specific Lighthouse setup and troubleshooting details      | When Codespaces base image or Lighthouse prerequisites change         |
| `design-system.md`             | Current visual, responsive, interaction, and accessibility rules      | After meaningful interface-system or shared-component changes         |
| `playwright-testing-design.md` | Hermetic Playwright smoke + visual testing setup and workflow         | When E2E test architecture, CI strategy, or baseline workflow changes |
| `typography-audit.md`          | Decision record for explicit prose sizing                             | When the `ProseContent` sizing contract changes                       |

## Scope Rules

### Keep in `/docs`

- Current status snapshots that affect decisions
- Environment/troubleshooting references that are too detailed for root `README.md`
- Maintainer process notes with ongoing operational value

### Keep at repository root

- `README.md` (primary project entrypoint)
- `LICENSE` and `LICENSE-CONTENT`
- `AGENTS.md`

### Keep outside `/docs`

- User-facing site content (`public/`)
- Application content (for example, `content/posts/`)

## Hygiene Checklist

- Prefer concise, status-driven docs over speculative planning notes.
- Keep one canonical document per concern.
- Give planning or historical docs an explicit status note near the top.
- Remove or merge docs when they become duplicative or stale.
