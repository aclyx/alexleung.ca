# Review Dimensions

Use this file to build the six sub-agent prompts and to keep the review output consistent.

## Refined Prompt

Use this when the user asks for a six-way PR review:

```text
Review this PR or branch against its true base branch. Use parallel sub-agents when the toolset supports them; otherwise run the same six review dimensions sequentially yourself and say that parallel mode was unavailable.

Review dimensions:
1. Security issue
2. Code quality
3. Bugs
4. Race
5. Test flakiness
6. Maintainability of the code

Requirements:
- Detect the actual PR base branch when PR metadata is available; otherwise fall back to `main`, then `origin/main`, and state which base was used.
- If sub-agents are available, give each agent the same diff context and changed-file list, but a different review focus.
- If sub-agents are unavailable, keep the same six review dimensions and produce them sequentially in one response.
- If delegated agents are used, keep collecting results until every agent reaches a terminal status or times out; do not assume one wait over multiple ids returns all results.
- Ask each agent for evidence-backed findings only, with `No findings` if clean.
- Summarize the result for each dimension with severity and file references where applicable.
- Call out incomplete coverage if any agent times out or lacks enough evidence.
```

## Shared Agent Prompt Frame

When sub-agents are used, every agent should receive:

- the base branch used
- the current branch name
- merge-base or diff range
- changed-file list
- diff summary or key hotspots
- instruction to focus on the assigned dimension only

Ask each agent to produce:

1. `Status`: `No findings`, `Findings`, or `Incomplete`
2. `Top items`: short bullets with severity and evidence
3. `Files`: direct file references
4. `Confidence`: `High`, `Medium`, or `Low`

## Dimension Checklists

### 1. Security issue

Focus on concrete vulnerabilities introduced or exposed by the diff:

- authn/authz regressions
- secrets exposure
- injection risks
- XSS
- SSRF
- path traversal
- insecure redirects
- unsafe deserialization
- missing validation at trust boundaries
- sensitive data leakage

Reject vague best-practice advice. Prefer exploitability and impact.

### 2. Code quality

Focus on reviewability and engineering quality problems:

- unnecessary complexity
- weak naming or structure that obscures intent
- duplication introduced by the PR
- over-abstraction or under-abstraction
- dead branches or inconsistent patterns
- error handling that is hard to reason about

Ignore pure style preferences unless they materially hurt clarity, or unless the user explicitly asked for taste/style/tone review. For visible site changes under that explicit request, apply the root `AGENTS.md` taste profile or the repo-local `site-taste-audit` skill.

### 3. Bugs

Focus on correctness and behavioral regressions:

- broken control flow
- wrong assumptions about nullability or data shape
- off-by-one or boundary handling
- missed error states
- invalid state transitions
- mismatches between caller and callee expectations

Prefer issues that can be tied to specific paths in the changed code.

### 4. Race

Interpret `Race` as race conditions and ordering hazards:

- async ordering bugs
- shared mutable state
- stale closure/state usage
- duplicate in-flight requests
- cache invalidation timing
- non-atomic read/modify/write behavior
- build-time or runtime concurrency hazards

Mark items clearly as confirmed or plausible.

### 5. Test flakiness

Focus on test nondeterminism and patterns that create flaky tests:

- timing-dependent assertions
- reliance on real clocks or random values
- order dependence
- shared mutable fixtures
- environment leakage
- network or filesystem assumptions
- async tests that do not fully await stabilization

If the PR changes production code in a way that is likely to destabilize tests, report that too.

### 6. Maintainability of the code

Focus on change cost over time:

- tightly coupled code paths
- hidden assumptions
- long functions or mixed concerns
- difficult extension points
- unclear ownership boundaries
- missing local documentation where logic is non-obvious
- changes that make future refactors riskier

Keep this distinct from code quality by emphasizing long-term evolution cost.
