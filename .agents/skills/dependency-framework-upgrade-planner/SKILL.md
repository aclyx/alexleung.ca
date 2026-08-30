---
name: dependency-framework-upgrade-planner
description: Plan dependency, framework, and toolchain upgrades. Use when asked to review library versions, identify outdated or deprecated packages/APIs, choose compatible upgrade targets, explain breaking changes, or produce a migration plan with concrete code modifications. Do not use for general maintainability audits or unused-dependency deletion.
---

# Dependency & Framework Upgrade Planner

Use this skill to evaluate dependency health in a codebase and produce a practical modernization plan.

## Goals

1. Identify outdated libraries and framework versions.
2. Suggest upgrade targets compatible with the current architecture and tooling.
3. Detect deprecated APIs and recommend modern replacements.
4. Call out likely breaking changes and required migration work.
5. Return a concise implementation plan with required code changes.

## Workflow

1. Inventory dependencies and framework usage.
   - Detect package manager and lockfile.
   - Read `package.json` (and workspace manifests when present).
   - Identify primary frameworks (runtime, build tools, test tools, lint/format).
   - Map versions currently used in source code (for example via imports and config files).

2. Detect outdated and risky dependencies.
   - Use package-manager-native registry inspection first. For Yarn 4, inspect each direct dependency with `yarn npm info <package> --fields version,versions,deprecated --json`; Yarn 4 does not provide `yarn outdated`.
   - Classify updates by severity:
     - patch/minor (low migration risk)
     - major (needs migration review)
     - deprecated/unmaintained (highest priority)
   - Distinguish direct dependencies from transitive dependencies.

3. Check deprecations and API usage.
   - Search code for APIs known to be deprecated in the target major versions.
   - For each deprecated API found, propose replacement syntax/patterns.
   - Include file-level locations for likely edits.

4. Evaluate compatibility and migration scope.
   - For each proposed upgrade, note:
     - target version range
     - compatibility with current framework/tooling
     - potential breaking changes
     - estimated migration effort (small/medium/large)
   - Flag sequencing constraints (for example upgrade TypeScript before ESLint plugins, or framework before adapter package).

5. Produce the final deliverables.
   - Output `Upgrade plan` using phased steps.
   - Output `Required code modifications` as a file-by-file checklist.
   - Prefer actionable bullets over long narrative.

## Command Guidance

Use the repository's package manager and scripts. For JavaScript/TypeScript repos, typical commands include:

- `corepack install`
- `yarn npm info <package> --fields version,versions,deprecated --json`
- `yarn why <package>`
- `yarn lint`
- `yarn typecheck`
- `yarn test`

If a command fails due to environment constraints, report that limitation and continue with best-effort analysis.

## Output Format

Follow this structure unless the user asks for a different format:

1. **Upgrade plan**
   - Phase 1: low-risk upgrades
   - Phase 2: framework/toolchain majors
   - Phase 3: deprecations and cleanup
   - Include why each phase is ordered this way.

2. **Required code modifications**
   - Group by package/framework.
   - For each item include:
     - files/components likely affected
     - API/config changes needed
     - validation steps (`lint`, `typecheck`, tests/build)

Use [upgrade-plan-template](references/upgrade-plan-template.md) when helpful.

## Quality Checklist

- Outdated packages were verified via command output, not assumptions.
- Recommendations match the repo's actual framework versions.
- Deprecated API replacements include concrete code-level guidance.
- Breaking changes are explicitly listed per major upgrade.
- Migration plan is sequenced, testable, and minimally disruptive.
