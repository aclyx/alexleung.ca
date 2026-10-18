# Upgrade plan

## Phase 1 - Safe updates (patch/minor)

- [ ] Package: `<name>` -> `<target version>`
  - Reason: `<security/fixes/perf>`
  - Notes: `<low-risk migration notes>`

## Phase 2 - Coordinated major upgrades

- [ ] Package/Framework: `<name>` -> `<target major>`
  - Breaking changes: `<summary>`
  - Required prep: `<prerequisites>`
  - Validation: `yarn lint && yarn typecheck && yarn test && yarn build`

## Phase 3 - Deprecation removal and cleanup

- [ ] Replace deprecated API: `<old API>` -> `<new API>`
  - Files: `<file paths>`
  - Example migration: `<before/after guidance>`

---

# Required code modifications

## `<package or framework>`

- Files to edit:
  - `<path 1>`
  - `<path 2>`
- Changes required:
  - `<config/code change 1>`
  - `<config/code change 2>`
- Breaking-change risk: `<low|medium|high>`
- Estimated effort: `<small|medium|large>`
- Validation commands:
  - `yarn lint`
  - `yarn typecheck`
  - `yarn test`
  - `yarn build`
