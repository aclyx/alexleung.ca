# Security Audit Checklist

Use this checklist while auditing a repository.

## 1) Injection Vulnerabilities
- Search for string-concatenated queries and unparameterized DB calls.
- Search for shell/OS command execution with user-controlled input.
- Search for dynamic template rendering/evaluation of untrusted strings.
- Search for direct HTML injection (`dangerouslySetInnerHTML`, raw render APIs) and missing sanitization.
- Search for file path composition from request input (path traversal risk).

Suggested search patterns:
- `eval\(`, `new Function\(`
- `exec\(`, `spawn\(`, `child_process`, `system\(`
- `dangerouslySetInnerHTML`, `innerHTML\s*=`, `document.write\(`
- `SELECT .*\+`, `query\(.*\+`, `$where`, `\$regex`

## 2) Unsafe Deserialization
- Locate deserialization of untrusted data formats (YAML/pickle/custom object mappers).
- Verify secure loaders and schema validation are used.
- Check object merge helpers for prototype pollution vectors.

Suggested search patterns:
- `yaml.load`, `pickle.loads`, `marshal.loads`, `deserialize`
- `Object.assign\(` with untrusted sources
- Deep merge utilities on request bodies

## 3) Authentication / Authorization
- Verify every privileged action has explicit authorization checks.
- Check object-level authorization for resource IDs (IDOR).
- Verify session/token validation and expiration handling.
- Confirm default-deny behavior for sensitive routes and APIs.

Suggested search patterns:
- Route handlers missing auth middleware
- `isAdmin` checks only in UI, not server
- Direct data fetch/update by arbitrary `id` parameters

## 4) Sensitive Data Exposure
- Search for hardcoded credentials, API keys, and private tokens.
- Check logs and error responses for leaked stack traces, secrets, or personal data.
- Verify secure cookie flags (`HttpOnly`, `Secure`, `SameSite`) and TLS assumptions.
- Verify secrets are sourced from environment/secret manager.

Suggested search patterns:
- `API_KEY`, `SECRET`, `TOKEN`, `PASSWORD`, `PRIVATE KEY`
- `console.log` around auth/session payloads
- Error handlers returning raw exception messages

## 5) Insecure Dependencies
- Run ecosystem-native dependency audits.
- Identify vulnerable direct and transitive dependencies.
- Check for unmaintained critical security packages.
- Recommend minimum safe versions and lockfile updates.

Common commands (adapt to project tooling):
- `yarn npm audit --all`
- `yarn npm info <package> --fields version,deprecated --json`
- `yarn why <package>`
- language-specific audit tooling where applicable

## Severity Guidance
- **Critical**: Remote compromise, auth bypass to admin, RCE, or mass data exfiltration with low complexity.
- **High**: Significant unauthorized access or data exposure with realistic attack path.
- **Medium**: Exploitable weakness with notable constraints or partial impact.
- **Low**: Defense-in-depth gap, low-impact leak, or hard-to-exploit weakness.

## Reporting Rules
- Provide exact file paths and line references for each finding.
- Include exploit preconditions and impact.
- Include a concrete patch (diff or patch-like snippet) for each confirmed issue.
- If uncertain, label as `Needs verification` and state what evidence is missing.
