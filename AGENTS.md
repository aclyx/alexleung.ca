# AGENTS.md

This file provides unified guidance for all AI agents (Claude, Gemini, etc.) when working with code in this repository.

Agents may create commits and pull requests when explicitly asked, so pre-commit and pre-PR verification requirements in this file are operational requirements, not suggestions.

Assume the worktree may already contain unrelated user changes. Inspect `git status` before editing. Before touching any file that already has staged or unstaged changes, inspect both `git diff -- <file>` and `git diff --cached -- <file>`. Do not overwrite staged user intent with full-file restaging, do not overwrite or revert unrelated work, and stop to ask if user-made changes directly conflict with the requested task. After any command that rewrites files or mutates the index, re-run `git status` plus file-scoped `git diff -- <touched-file>` and `git diff --cached -- <touched-file>` for the files you actually changed.

## Project Overview

Personal portfolio website for Alex Leung. Multi-page static-export site for GitHub Pages deployment. Built with Next.js 16, React 19, TypeScript, and Tailwind CSS.

## Package Manager

**This project uses Yarn.** Do not use `npm` or `pnpm`.
Use the repo-pinned Yarn 4 toolchain for installs and scripts. Before relying on normal repo scripts or Git hooks in this repository, verify that plain `yarn --version` reports `4.13.0`.

- If you change dependencies, run `yarn install` after the local Yarn 4 setup is verified, update `yarn.lock`, and include that change in the commit or PR.

### Yarn 4 / Corepack requirements

- Align local Node with `.nvmrc` (`v24.14.0`) before diagnosing Yarn/Corepack or repo-script failures.
- The repo pins Yarn via `packageManager` in `package.json` (`yarn@4.13.0`).
- Run `corepack install` in the repo to fetch the exact pinned Yarn version.
- Before plain `yarn --version` is `4.13.0`, the allowed bootstrap/fallback commands are: `corepack install`, `corepack yarn install`, `corepack yarn prepare`, and `corepack yarn image:variants:stage`.
- Before plain `yarn --version` is `4.13.0`, do not rely on normal repo scripts such as `yarn build`, `yarn test`, `yarn lint`, or on Git hooks.
- Only run `corepack enable` when machine-level changes are permitted and appropriate for the environment.
- After bootstrap, verify `yarn --version` reports `4.13.0`. Only then rely on normal repo scripts and Git hooks.
- Only check hook setup when you are preparing to rely on hook automation for a commit/PR workflow.
- If `git config core.hooksPath` is not `.githooks`, run `corepack yarn prepare` while bootstrapping or `yarn prepare` after plain `yarn --version` is verified.
- After `prepare`, verify `git config core.hooksPath` returns `.githooks` before relying on hook behavior.
- In CI, enable Corepack before `yarn install` to avoid falling back to global Yarn 1.x.

## Development Commands

```bash
yarn dev              # Start development server (port 3000)
yarn prepare          # Configure repo Git hooks path (.githooks)
yarn image:variants   # Generate image variants and refresh image variant manifest
yarn image:variants:stage  # Generate variants for staged changes and git-add outputs
yarn build            # Build static export to out/ (runs prebuild)
yarn lint             # Run ESLint and Prettier checks
yarn lint:fix         # Auto-fix lint issues
yarn test             # Run Jest tests
yarn test:e2e         # Run Playwright smoke tests in Docker
yarn test:e2e:host    # Run Playwright smoke tests directly on the host when Docker is unavailable
yarn test:e2e:visual  # Run Playwright visual regression tests in Docker
yarn test:e2e:visual:host  # Run Playwright visual regression tests directly on the host when Docker is unavailable
yarn test:e2e:visual:update  # Regenerate Playwright visual snapshots in Docker
yarn test:e2e:visual:update:host  # Regenerate Playwright visual snapshots directly on the host when Docker is unavailable
yarn typecheck        # Run TypeScript type checking (no emit)
yarn test:watch       # Run tests in watch mode
yarn test:coverage    # Run tests with coverage report
yarn perf:lighthouse  # Run Lighthouse CI assertions
yarn deploy           # Build and deploy to GitHub Pages
```

## Architecture

### Static Export Configuration

- `output: 'export'` in `next.config.mjs` generates static files to `out/`
- `trailingSlash: true` for GitHub Pages compatibility
- `.nojekyll` in public/ prevents Jekyll processing of `_next/` assets
- Images are unoptimized (required for static export)
- Internal site-route links should use trailing slashes to match the export shape and avoid unnecessary GitHub Pages redirects (for example, `/about/` and `/blog/post-slug/`, not `/about` or `/blog/post-slug`)
- Do not add trailing slashes to file-like endpoints or assets such as `/feed.xml`, `/robots.txt`, `/sitemap.xml`, or `/assets/...`

### Component Organization

- `src/app/` - Next.js App Router pages with route-specific `_components/` subdirectories
- `src/components/` - Shared components (Header, Footer, SocialLinks, etc.)
- `src/constants/` - Data files (skills.ts, socialLinks.tsx)

### Image Variant Workflow

- Build-time script `scripts/generate-image-variants.mjs` generates responsive variants and manifest metadata:
  - cover variants: `*-card-sm.webp`, `*-card.webp`, `*-hero-sm.webp`, `*-hero.webp`
  - inline markdown variants: `*-content-sm.webp`, `*-content.webp`
  - static asset variants for background and about portrait
  - manifest: `src/generated/imageVariantManifest.json` (profiles + variant paths + dimensions)
- `yarn build` runs `prebuild`, which runs `yarn image:variants`.
- `src/components/BlogPostCard.tsx` and `src/app/blog/[slug]/page.tsx` resolve cover variants from manifest profiles.
- `src/lib/markdownToHtml.ts` resolves inline image variants from manifest profiles.
- Pre-commit hook `.githooks/pre-commit` runs `yarn image:variants:stage` so generated variants and manifest stay in sync with staged content/image changes, but only after `prepare` has configured the hooks path and plain `yarn` is available on `PATH` as the pinned Yarn version. Treat the hook as best-effort automation; if hooks are not active or if the hook reports a skip because Yarn is unavailable, run `corepack yarn image:variants:stage` manually before commit when relevant.
- Runtime has hard-failure checks for missing required manifest profiles (`profiles.cover.card`, `profiles.cover.hero`, `profiles.inlineContent`).

### Adding Images (Agent Guidance)

- Always add source images under `public/assets/...`.
- For blog covers: update frontmatter `coverImage` in `content/posts/*.md`.
- For inline blog images: add standard markdown image references.
- After any source image addition/update, run `yarn image:variants` (or `yarn image:variants:stage` when preparing a commit) and ensure the generated assets under `public/assets/...` plus `src/generated/imageVariantManifest.json` are included.

### SEO and Structured Data

- Shared metadata defaults live in `src/app/layout.tsx`, with page-specific metadata in route files via `buildPageMetadata` where needed
- JSON-LD Person schema with `react-schemaorg` and `schema-dts`
- Open Graph and Twitter card metadata

### Now Page Timeline Workflow

- The current `/now/` page and `/now/timeline/` archive render from `src/content/nowSnapshots.json`.
- When changing current Now page content, update `src/content/nowSnapshots.json` rather than hardcoding dated content in `src/app/now/page.tsx`.
- For a same-day copy fix, edit the latest snapshot and preserve existing snapshot, section, block, and list item IDs when the meaning is still the same.
- For a new dated Now update, add a new first snapshot with a unique `now-YYYY-MM-DD` id, preserve semantic section and block IDs where possible, and create new IDs only for genuinely new content.
- After changing Now timeline data or the Now page renderer, run `yarn now:timeline:check`.

### Testing

- Jest with React Testing Library
- Playwright E2E coverage runs in Docker via `docker compose` by default, with host-mode wrappers available for environments where Docker is unavailable: `yarn test:e2e:host`, `yarn test:e2e:visual:host`, and `yarn test:e2e:visual:update:host`
- Temporary Windows/WSL exception: until the Windows Docker/Playwright harness issue is fixed, agents running from a Windows host against this WSL checkout may treat Playwright smoke/visual coverage as environment-blocked and skip those suites automatically, but they must say that explicitly in the handoff and must not claim those suites passed.
- Jest tests live in `__tests__/` subdirectories alongside source files
- Playwright tests live under `playwright/tests/` with shared setup in `playwright.config.ts` and `playwright/fixtures/`
- `yarn test:e2e` covers smoke flows across desktop/mobile Chrome and Safari/WebKit
- `yarn test:e2e:visual` covers desktop and mobile Chromium visual baselines
- 70% coverage threshold enforced under `yarn test:coverage` / coverage runs, not the default `yarn test` command
- Module alias `@/` maps to `src/`

### Verification Guardrails (Agent Guidance)

- Do not claim the repo is clean or that changes are verified unless you have run the relevant checks in this workspace and seen them pass.
- During normal iteration, run `yarn lint`, `yarn typecheck`, `yarn test`, and `yarn build` for any repository change unless the user explicitly asked for a narrower verification scope.
- For Playwright verification, use the Docker commands when Docker is available. If `docker` is missing or the daemon is unavailable, run the corresponding host-mode wrappers instead of skipping E2E coverage, and state which path you used.
- Temporary Windows/WSL exception: if the agent is running from Windows against this WSL repo and the known Docker/Playwright harness issue applies, the agent may skip `yarn test:e2e`, `yarn test:e2e:visual`, and the host-mode Playwright wrappers without retrying alternate Playwright paths. Treat those suites as environment-blocked, still run the non-Playwright gate, and state the skip explicitly.
- If typography classes, prose sizing, or breakpoint-sensitive copy/layout are changed, also verify the affected UI at both mobile and `md`+ breakpoints via local browser inspection or relevant Playwright coverage.
- If a failure is only formatting, fix it and rerun the failing command rather than reporting partial success.
- Prefer file-scoped fixes over repo-wide autofix commands. In a dirty worktree, do not run repo-wide mutating commands such as `yarn lint:fix` unless the user explicitly wants that broader scope.
- When a test or lint failure contradicts an earlier assumption, do not treat the failure as incidental. If you are already fixing code or guidance, update it and rerun the relevant checks; otherwise surface the contradiction clearly and stop for direction rather than widening scope silently.
- If verification fails because of unrelated pre-existing changes or baseline repo issues, report that separately from failures introduced by your current change. Do not silently absorb unrelated breakage into your task unless the user explicitly asks.
- Before creating a commit or pull request, manually run the full verification gate: `yarn lint`, `yarn typecheck`, `yarn test`, `yarn build`, plus Playwright smoke and visual coverage via `yarn test:e2e` and `yarn test:e2e:visual` when Docker is available, otherwise `yarn test:e2e:host` and `yarn test:e2e:visual:host`.
- The full pre-commit / pre-PR gate is intentionally universal in this repository, even for docs-only or policy-only changes, unless the user explicitly narrows the requirement. The Git hook does not enforce this gate for you.
- If intentional UI changes cause visual snapshot failures, run `yarn test:e2e:visual:update` to refresh snapshots when Docker is available, otherwise `yarn test:e2e:visual:update:host`, then rerun the matching visual suite, mention the snapshot update explicitly, and ensure updated snapshot artifacts are included in the commit or PR.
- If any required verification step is blocked by the local environment after trying the supported Docker or host Playwright path as appropriate, say so explicitly in the final handoff, do not claim full verification, and do not create a commit or PR unless the user explicitly waives that requirement.

### Remote PR Feedback Workflow (Agent Guidance)

- If the user asks you to respond to GitHub PR feedback/review comments and the local checkout does not contain PR discussion context, use the public repository on GitHub as the source of truth: `https://github.com/aclyx/alexleung.ca`.
- For PR feedback tasks, first determine the exact PR number (from user input, branch context, or linked PR URL). If you cannot determine it reliably, ask for the PR URL/number before making code changes.
- Retrieve and review PR discussion context from the PR page, including review comments, issue comments, and unresolved conversations before editing files.
- Before implementing changes, summarize the unresolved feedback items you plan to address so interpretation is explicit.
- If GitHub access is unavailable in the current environment, report the limitation clearly and stop instead of guessing about PR feedback state.
- Do not assume local git history or commit messages include complete reviewer feedback.

### PR Creation Defaults (Agent Guidance)

- When creating a pull request, default to a regular ready-for-review PR rather than a draft PR unless the user explicitly asks for draft status or the work is intentionally incomplete/blocking on follow-up.
- Do not add PR labels/tags by default. If a tool or workflow offers labels such as `codex`, leave them off unless the user explicitly requests specific labels or the repository requires them.
- For any request path that creates commits or pull requests (including the yeet skill), keep wording tool-agnostic: do not mention Codex or any other AI agent/model by name.

### Windows / WSL Worktrees (Agent Guidance)

- If a WSL worktree was created by Windows git, the worktree `.git` file may point at a Windows-style `//wsl.localhost/...` gitdir that WSL git cannot resolve automatically.
- When WSL-only tooling such as `node`, `yarn`, or `gh` must operate on that worktree, run from WSL with explicit environment variables that point at your own checkout metadata: `GIT_DIR=<path-to-main-repo>/.git/worktrees/<worktree-name>` and `GIT_WORK_TREE=<path-to-this-worktree>`.
- The worktree name is usually visible in the worktree `.git` file. Use the WSL path to the primary checkout that owns the shared `.git/worktrees/` directory for `<path-to-main-repo>`, and use `pwd` for `<path-to-this-worktree>`. Validate the setup with `git status --short --branch` before running other WSL git commands.
- When pushing a rebased PR branch from one of these worktrees, prefer WSL `git` / WSL `gh` with those explicit `GIT_DIR` / `GIT_WORK_TREE` values, because Windows-side SSH auth may be unavailable even when WSL GitHub auth works.
- When updating an existing remote PR branch after a rebase, prefer `git push --force-with-lease` over plain `--force`.

### Typography and Prose Guardrails (Agent Guidance)

- Reference audit: `docs/typography-audit.md`.
- Prefer semantic typography utilities for body/headline copy:
  - body: `text-body-sm`, `text-body`, `text-body-lg`
  - headings: `text-heading-sm`, `text-heading`
  - hero: `text-hero-subtitle`, `text-hero-title`, `text-hero-description`
- Do not use `text-md` (not a Tailwind default utility).
- `ProseContent` defaults to base prose sizing. Use `size="lg"` for `md:prose-lg`; for small notes/footers, explicitly set `size="sm"` so both `prose-sm` and `md:prose-sm` are applied.
- When editing typography classes, verify rendered size at both mobile and `md`+ breakpoints via local browser inspection or the relevant Playwright coverage. Do not claim breakpoint verification unless you actually performed one of those checks.

### Copy Editing Guardrails (Agent Guidance)

- Target site voice: first-person where appropriate; humble, grounded, and clearly experienced; warm but understated; professional without becoming sterile. Confidence should come from evidence, specific work, and concrete observations rather than self-description or positioning claims.
- Tone should be thoughtful, understated, concrete, and mildly warm. Prefer clear first-person language and specific descriptions over polished positioning copy.
- Prefer revising existing copy over rewriting from scratch unless the current structure is actively causing clarity or tone problems.
- Prefer site-representative language over recruiter-optimized phrasing in top-level labels such as homepage headlines, page titles, section names, metadata descriptions, `public/manifest.json`, `public/llms.txt`, RSS/feed text, and JSON-LD descriptions.
- Treat visible pages and machine-facing summaries as one editorial system: navigation labels, CTA labels, blog titles/excerpts/intros, metadata, RSS/feed text, manifest text, `llms.txt`, and JSON-LD/schema text should feel consistent without becoming copy-pasted.
- Preserve warmth and voice before adding positioning language. Avoid recruiter-buzzy or self-promotional filler such as `thought leader`, `world-class`, `high-impact`, `passionate`, `results-driven`, or similar phrasing. Avoid inflated claims or interpretive self-assessments when a simpler factual description will do.
- Do not force SEO phrases into headings when they fit better in supporting copy or metadata descriptions.
- Avoid repeating the same positioning claim across hero, section intros, metadata, manifest text, RSS text, `llms.txt`, and JSON-LD. Keep them directionally consistent without making them all identical.
- For metadata and machine-facing summaries, prefer durable wording over quickly stale current-state details unless the surface is intentionally time-stamped, such as the body of the Now page.
- Use credentials, project history, and domain experience as factual context when relevant, but avoid turning them into a pitch.
- Prefer direct, literal phrasing over abstract framing when editing prose. If the concrete mechanism, limitation, UI behavior, or comparison can be named directly, name it.
- For personal reflections and lifestyle posts, open from concrete lived details before interpretation. Avoid polished thesis scaffolding, rhetorical contrast templates, and decorative atmosphere labels unless the user explicitly asks for a more essayistic style.
- If the user corrects tone more than once, stop making local sentence swaps. Reread the whole section, name the repeated pattern, and revise from the user-provided facts outward.
- Avoid draft-scaffolding phrases such as `the third thread`, `interesting middle ground`, or similar meta-organizing language when the actual point can be stated plainly.
- Avoid rhetorical contrast templates like `it is one thing ... it is another ...` unless the user explicitly wants a more essayistic style.
- Avoid pairing near-synonyms in the same sentence just for polish; if two clauses do not add distinct meaning, collapse them.
- Keep experiential claims tightly bounded. Do not introduce phrases like `over time`, `in practice`, or other duration/usage claims unless the user explicitly established that scope.
- Before changing labels or short copy in response to a brief user instruction like `do it`, state the chosen interpretation in a short update before editing if there were multiple plausible options in the immediately preceding discussion.
- Do not add emphasis styling such as bold inline links unless the existing page already uses that pattern or the user asked for stronger emphasis.
- Treat `meta keywords` as low-value by default. Only add them if the repo has a concrete downstream use for them.

### Planning and Skill Authoring Guardrails (Agent Guidance)

- For planning or implementation documents, provide estimates as scope/effort (for example S/M/L or low/medium/high complexity) instead of timeline-based durations or dates.
