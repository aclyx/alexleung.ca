---
name: pr-parallel-review
description: Review a pull request or current branch with six parallel review dimensions. Use only when the user explicitly asks for sub-agents, parallel review, or a six-way PR/branch audit covering security, code quality, bugs, race conditions, test flakiness, and maintainability.
---

# Parallel PR Review

Use this skill when the user explicitly wants parallel agent work for a PR or branch review.

Load [references/review-dimensions.md](references/review-dimensions.md) before writing agent prompts.

## Workflow

1. Establish the review target.
   - If reviewing an open PR, detect the actual base branch from PR metadata first (for example `gh pr view --json baseRefName`).
   - Otherwise default to comparing `HEAD` against `main`.
   - If the chosen base branch is unavailable locally, use its remote-tracking equivalent (for example `origin/<base>`).
   - If no PR base is available and `main` is unavailable locally, use `origin/main`.
   - State the exact base you used.
   - Collect shared context once before delegating:
     - current branch name
     - merge base
     - `git diff --stat` summary
     - changed-file list
     - any obvious hotspots from the diff

2. Choose the review execution mode.
   - If sub-agent delegation is available, spawn exactly one sub-agent per review dimension.
   - Prefer `explorer` agents for read-only review when that agent type exists; otherwise use the closest available read-only agent type.
   - Give every delegated agent the same base context and changed files.
   - Change only the review dimension and checklist.
   - Keep the prompts concrete. Ask for evidence-backed findings only, not general advice.
   - Require explicit `no findings` when the agent does not find a real issue.
   - If sub-agent delegation is unavailable, run the same six review dimensions sequentially in the main agent and state that the result is a non-parallel fallback.

3. Collect delegated results completely.
   - Start all six delegated agents before waiting on results.
   - Do not rely on a single `wait_agent` call over all ids; keep collecting results until every delegated agent reaches a terminal status or the run times out.
   - If an agent times out, note that explicitly in the summary instead of silently omitting it.

4. Summarize by dimension.
   - Preserve the six original headings:
     1. Security issue
     2. Code quality
     3. Bugs
     4. Race
     5. Test flakiness
     6. Maintainability of the code
   - For each heading, report one of:
     - `No findings`
     - `Findings` with the top issues, severity, and file references
     - `Incomplete` with the reason
   - Deduplicate overlapping issues across sections, but still mention them where relevant.

## Output Contract

Return findings first. Keep each section short and evidence-based.

If you had to fall back to a non-parallel review because delegation was unavailable, say so before the six sections.

- `Security issue`: confirmed or likely vulnerabilities in the diff
- `Code quality`: harmful complexity, duplication, or poor abstractions
- `Bugs`: functional regressions or correctness defects
- `Race`: race conditions, ordering hazards, stale async state, concurrency risks
- `Test flakiness`: nondeterministic tests or code patterns likely to cause flaky tests
- `Maintainability of the code`: long-term readability, coupling, and change-cost concerns

After the six sections, add a short `Cross-cutting notes` section only if multiple agents reported the same root problem.

## Quality Bar

- Review the actual diff, not the whole repository in the abstract.
- Prefer changed files first, but inspect adjacent code when needed to confirm impact.
- Distinguish confirmed issues from plausible risks.
- Avoid style-only feedback unless it affects correctness, reviewability, maintenance cost, or the user explicitly asks for taste/style/tone review. For visible site changes under that explicit request, apply the root `AGENTS.md` taste profile or the repo-local `site-taste-audit` skill.
- If you did not run tests or static checks, say so.
