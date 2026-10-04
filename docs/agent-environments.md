# Agent Environments

Use this reference for environment failures, not application test failures. Report the attempted command and observed error; do not describe an unrun suite as passed.

## Windows/WSL worktrees

- If a WSL worktree was created by Windows git, the worktree `.git` file may point at a Windows-style `//wsl.localhost/...` gitdir that WSL git cannot resolve automatically.
- When WSL-only tooling such as `node`, `yarn`, or `gh` must operate on that worktree, run from WSL with explicit environment variables that point at your own checkout metadata: `GIT_DIR=<path-to-main-repo>/.git/worktrees/<worktree-name>` and `GIT_WORK_TREE=<path-to-this-worktree>`.
- The worktree name is usually visible in the worktree `.git` file. Use the WSL path to the primary checkout that owns the shared `.git/worktrees/` directory for `<path-to-main-repo>`, and use `pwd` for `<path-to-this-worktree>`. Validate the setup with `git status --short --branch` before running other WSL git commands.
- When pushing a rebased PR branch from one of these worktrees, prefer WSL `git` / WSL `gh` with those explicit `GIT_DIR` / `GIT_WORK_TREE` values, because Windows-side SSH auth may be unavailable even when WSL GitHub auth works.
- When updating an existing remote PR branch after a rebase, prefer `git push --force-with-lease` over plain `--force`.

## Windows/WSL Playwright exception

The temporary exception applies only to a Windows-launched agent operating on a WSL checkout with evidence of the known browser-test startup problem. A Windows or WSL environment alone is not enough. Record the failed command, startup error, and relevant Docker/Playwright environment in the task handoff; a prior failure in the same unchanged environment can supply that evidence. If no such evidence is available, try the normal Docker path or the host wrapper when Docker is unavailable.

While that startup failure persists, the agent may skip smoke, visual, and alternate host retries, run the non-Playwright gate, and explicitly report browser coverage as environment-blocked. This exception does not excuse failing assertions or apply to other platforms.

Recheck when Docker, Playwright, Node, WSL interop, or the agent's execution environment changes. Retire the exception once both smoke and visual suites pass from the affected Windows-to-WSL entry point; record the successful commands and environment, then remove this section and its link from `AGENTS.md`. There is no general permission to skip browser tests after that condition is met.

## Host build cannot start a subprocess

A restricted host can prevent the production compiler from binding its subprocess port. If the error is an environment restriction and Docker is available, use the repository's Playwright container for the build:

```bash
docker compose run --rm playwright-smoke /bin/bash -lc 'set -euo pipefail; mkdir -p /tmp/pw-home; corepack enable; corepack install; yarn install --immutable; yarn --version; yarn build'
```

This uses the same container and dependency setup as the browser suites. Inspect the exit status and build output; do not classify ordinary compiler failures as environment restrictions. Report that the build ran in Docker. See [Playwright testing](playwright-testing-design.md) for smoke and visual commands.
