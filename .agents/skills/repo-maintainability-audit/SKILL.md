---
name: repo-maintainability-audit
description: Broad repository audit for maintainability and correctness risks. Use when asked for a repo health review, prioritized bug/complexity findings, architectural cleanup opportunities, or remediation diffs with impact/risk estimates. Prefer specialized skills for security audits, dependency upgrades, dead-code sweeps, PR parallel reviews, or targeted AI-code simplification.
---

# Repository Maintainability & Correctness Audit

Execute this workflow when producing a high-signal engineering audit.

Use this as the broad audit skill. If the user's request is mainly about vulnerabilities, dependency/framework versions, unused code, a parallel PR review, or site taste/style/tone, use the matching specialized skill instead.

## Workflow

1. Map project context quickly.
   - Read top-level docs (`README*`, `AGENTS.md`, architecture docs, config files).
   - Infer stack, runtime assumptions, lint/test/typecheck tools, and coding conventions.

2. Collect evidence with static checks.
   - Run baseline quality checks using the repo's package manager and scripts.
   - Prefer targeted scans for risky areas (parsing, async flows, stateful code, I/O boundaries, serialization, null/undefined handling).
   - Use fast code search to locate complexity hotspots, duplicate branches, TODO/FIXME, and deprecated APIs.

3. Review correctness and maintainability.
   - Identify likely bugs, undefined behavior, weak error handling, stale assumptions, and edge-case gaps.
   - Flag unnecessary complexity (long functions, high branching, tight coupling, mixed concerns).
   - Detect duplication and recommend consolidation opportunities.
   - Detect outdated patterns when they affect maintainability; leave full upgrade planning to `dependency-framework-upgrade-planner`.

4. Prioritize findings.
   - Prioritize by user impact, likelihood, blast radius, and remediation effort.
   - Assign each item:
     - **Priority**: P0 (critical), P1 (high), P2 (medium), P3 (low)
     - **Impact**: High / Medium / Low
     - **Risk**: High / Medium / Low (risk of implementing the fix)

5. Propose concrete remediations.
   - Provide focused patch suggestions as unified diffs.
   - Keep diffs minimal and composable; avoid unrelated refactors.
   - Include test updates when behavior changes.

## Output Format

Return findings in this structure:

1. **Prioritized Issues**
   - `[Px] Title`  
     - Evidence: file paths + brief rationale  
     - Impact: High/Medium/Low  
     - Risk: High/Medium/Low  
     - Recommendation: concise fix summary

2. **Suggested Code Changes (Diffs)**
   - One or more fenced `diff` blocks per issue.
   - Include only the lines needed to illustrate safe remediation.

3. **Estimated Impact and Risk Summary**
   - Table or bullets summarizing expected reliability/maintainability gains and implementation risk.

## Quality Bar

- Prefer evidence-backed claims over speculative concerns.
- Distinguish confirmed issues from probable risks.
- Align recommendations to existing project architecture and style.
- When the audit touches visible site surfaces, respect the root `AGENTS.md` taste profile: concrete, understated, utility-minded, balanced, readable, and plain-spoken.
- Optimize for actionable, incremental changes that can be reviewed independently.
