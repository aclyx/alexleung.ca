import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const validator = fileURLToPath(
  new URL("../check-agent-harness.mjs", import.meta.url)
);

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "agent-harness-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const write = (path, text) => {
    const file = join(root, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, text);
  };
  write("AGENTS.md", "Read [voice](docs/writing-voice.md).\n");
  write("docs/writing-voice.md", "# Voice\n");
  write("docs/agent-environments.md", "# Environments\n");
  write(
    ".agents/skills/example/SKILL.md",
    "---\nname: example\ndescription: A scoped task.\n---\n# Example\n"
  );
  write(
    ".agents/skills/example/agents/openai.yaml",
    'interface:\n  display_name: "Example"\n'
  );
  return {
    write,
    run: () => {
      const result = spawnSync(process.execPath, [validator], {
        cwd: root,
        encoding: "utf8",
      });
      assert.ifError(result.error);
      return { status: result.status, output: result.stdout + result.stderr };
    },
  };
}

test("accepts valid metadata and ignores illustrative links in code", (t) => {
  const f = fixture(t);
  f.write(
    "AGENTS.md",
    "```md\n[example](missing.md)\n```\n`[inline](missing.md)`\n[voice][v]\n\n[v]: docs/writing-voice.md\n"
  );
  assert.equal(f.run().status, 0);
});

test("rejects a broken reference-style local link", (t) => {
  const f = fixture(t);
  f.write("AGENTS.md", "Read [guide].\n\n[guide]: docs/missing.md\n");
  const result = f.run();
  assert.equal(result.status, 1);
  assert.match(
    result.output,
    /AGENTS.md: missing local link target: docs\/missing.md/
  );
});

test("rejects missing frontmatter and mismatched skill identity", (t) => {
  const f = fixture(t);
  f.write(".agents/skills/example/SKILL.md", "# No metadata\n");
  assert.match(f.run().output, /missing YAML frontmatter/);
  f.write(
    ".agents/skills/example/SKILL.md",
    "---\nname: different\ndescription: ''\n---\n"
  );
  const result = f.run();
  assert.equal(result.status, 1);
  assert.match(result.output, /name must match/);
  assert.match(result.output, /description must be a nonempty string/);
});

test("rejects malformed YAML and incorrectly typed invocation metadata", (t) => {
  const f = fixture(t);
  f.write(".agents/skills/example/agents/openai.yaml", "interface: [\n");
  assert.equal(f.run().status, 1);
  f.write(
    ".agents/skills/example/agents/openai.yaml",
    "interface:\n  display_name: 42\npolicy:\n  allow_implicit_invocation: 'false'\n"
  );
  const result = f.run();
  assert.equal(result.status, 1);
  assert.match(
    result.output,
    /interface.display_name must be a nonempty string/
  );
  assert.match(result.output, /allow_implicit_invocation must be boolean/);
});
