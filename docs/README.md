# Documentation Directory Guide

This folder contains maintainer-facing documentation that supports implementation, operations, and project memory. Prefer short status/runbook docs for active concerns; keep larger planning artifacts clearly labeled when they are parked or historical.

## Document Index

### Active Status And Runbooks

| File                           | Purpose                                                               | Update cadence                                                        |
| ------------------------------ | --------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `architecture-seo-status.md`   | Status snapshot for technical architecture and SEO                    | After meaningful architecture, metadata, schema, or IA changes        |
| `blog-notification-report.md`  | Notification architecture and operational runbook for new-post alerts | When notification provider, subscribe UX, or feed workflow changes    |
| `codespaces.md`                | Codespaces-specific Lighthouse setup and troubleshooting details      | When Codespaces base image or Lighthouse prerequisites change         |
| `playwright-testing-design.md` | Hermetic Playwright smoke + visual testing setup and workflow         | When E2E test architecture, CI strategy, or baseline workflow changes |
| `typography-audit.md`          | Typography audit history and current prose guardrails                 | After typography-system or prose-behavior changes                     |

### Feature Notes

| File                               | Purpose                                                     | Update cadence                                              |
| ---------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------- |
| `pid-controller-simulator.md`      | PID simulator architecture, math model, and extension notes | When simulator model, presets, or stepping behavior changes |
| `load-flow-implementation-plan.md` | Load-flow implementation status and remaining work          | When load-flow routing, solver scope, or UI scope changes   |

### Parked Planning References

| File                                      | Purpose                                               | Update cadence                          |
| ----------------------------------------- | ----------------------------------------------------- | --------------------------------------- |
| `industrial-ee-browser-utilities-plan.md` | Parked plan for possible future engineering utilities | Only when the plan becomes active again |

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
