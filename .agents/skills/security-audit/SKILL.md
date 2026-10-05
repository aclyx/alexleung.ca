---
name: security-audit
description: Perform focused repository security audits for web and application codebases. Use when asked to find injection vulnerabilities, unsafe deserialization, authentication/authorization flaws, sensitive data exposure, insecure dependencies, or patch-ready vulnerability fixes. Do not use for general maintainability or dependency modernization planning.
---

# Security Audit

## Overview

Run a focused code-and-dependency security review and return actionable findings with concrete remediations. Prefer reproducible evidence (file paths, line numbers, and commands) and include patch-ready code changes when feasible.

## Audit Workflow

1. **Map attack surface**
   - Identify runtime stack, frameworks, auth boundaries, and input entry points.
   - Locate secrets handling, environment configuration, and dependency manifests.

2. **Scan for required vulnerability classes**
   - Injection vulnerabilities (SQL/NoSQL/command/template/XSS/path traversal).
   - Unsafe deserialization (untrusted `JSON.parse` alternatives, object merging, YAML/pickle/eval-like loaders).
   - Authentication/authorization flaws (missing checks, IDOR, privilege escalation, weak session handling).
   - Sensitive data exposure (hardcoded secrets, verbose error leakage, insecure transport/storage, logging PII/tokens).
   - Insecure dependencies (known vulnerable packages, abandoned packages, risky version ranges).

3. **Validate findings**
   - Confirm exploitability and preconditions.
   - Remove false positives; clearly mark uncertain issues as "needs verification".

4. **Fix or propose patch**
   - Prefer minimal, targeted code patches.
   - If code change is unsafe without more context, provide a safe pseudopatch and exact hardening steps.

5. **Produce final report**
   - Use the output contract exactly.

## Required Checks and Heuristics

Use `references/security-audit-checklist.md` as the primary checklist and command quick-reference.

## Output Contract

For each finding, include:

- **Vulnerability description**: What is wrong, where it exists, and a realistic attack scenario.
- **Risk severity**: `Critical`, `High`, `Medium`, or `Low` with a one-line justification.
- **Suggested fix and patch**: Explain remediation and provide a concrete patch snippet or diff.

Use this structure:

````markdown
## Finding N: <short title>

- Vulnerability description: ...
- Risk severity: <Critical|High|Medium|Low> - <justification>
- Suggested fix and patch:

```diff
<patch>
```
````

## Execution Notes

- Prefer deterministic checks first (linters, dependency audit commands, targeted search patterns), then manual review.
- Do not claim a vulnerability without evidence.
- Keep recommendations framework-appropriate and least disruptive.
