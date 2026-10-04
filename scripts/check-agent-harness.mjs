import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

import matter from "gray-matter";
import { remark } from "remark";
import { parse } from "yaml";

const root = process.cwd();
const errors = [];
const markdown = [
  "AGENTS.md",
  "docs/writing-voice.md",
  "docs/agent-environments.md",
];

function report(file, message) {
  errors.push(`${relative(root, file)}: ${message}`);
}

function isMapping(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function readYaml(file, frontmatter = false) {
  try {
    const source = readFileSync(file, "utf8");
    if (frontmatter && !matter.test(source)) {
      throw new Error("missing YAML frontmatter");
    }
    const value = frontmatter
      ? matter(source, { engines: { yaml: parse } }).data
      : parse(source);
    if (!isMapping(value)) throw new Error("expected a YAML mapping");
    return value;
  } catch (error) {
    report(file, error.message);
    return null;
  }
}

function requireText(file, value, field) {
  if (typeof value !== "string" || !value.trim()) {
    report(file, `${field} must be a nonempty string`);
  }
}

function inspectDirectory(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) inspectDirectory(file);
    else if (entry.isFile() && file.endsWith(".md")) markdown.push(file);
    else if (entry.isFile() && /\.ya?ml$/.test(file)) {
      const data = readYaml(file);
      if (!data || entry.name !== "openai.yaml") continue;
      if (data.interface !== undefined) {
        if (!isMapping(data.interface))
          report(file, "interface must be a mapping");
        else {
          for (const key of [
            "display_name",
            "short_description",
            "default_prompt",
          ]) {
            if (data.interface[key] !== undefined) {
              requireText(file, data.interface[key], `interface.${key}`);
            }
          }
        }
      }
      if (data.policy !== undefined) {
        if (!isMapping(data.policy)) report(file, "policy must be a mapping");
        else if (
          data.policy.allow_implicit_invocation !== undefined &&
          typeof data.policy.allow_implicit_invocation !== "boolean"
        ) {
          report(file, "policy.allow_implicit_invocation must be boolean");
        }
      }
    }
  }
}

function checkLinks(file, node) {
  // Parsing Markdown excludes example links inside fenced code and inline code.
  if (["link", "image", "definition"].includes(node.type)) {
    const url = node.url;
    if (!/^(?:[a-z][a-z\d+.-]*:|\/|#)/i.test(url)) {
      try {
        const target = decodeURIComponent(url.split(/[?#]/)[0]);
        if (target && !existsSync(resolve(dirname(file), target))) {
          report(file, `missing local link target: ${url}`);
        }
      } catch {
        report(file, `invalid local link: ${url}`);
      }
    }
  }
  for (const child of node.children ?? []) checkLinks(file, child);
}

try {
  const skillsDirectory = join(root, ".agents/skills");
  const skills = readdirSync(skillsDirectory, { withFileTypes: true }).filter(
    (entry) => entry.isDirectory()
  );
  if (!skills.length) throw new Error("no repository skills found");
  for (const skill of skills) {
    const file = join(skillsDirectory, skill.name, "SKILL.md");
    const data = readYaml(file, true);
    if (!data) continue;
    if (
      data.name !== skill.name ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.name)
    ) {
      report(file, "name must match its lowercase hyphenated directory name");
    }
    requireText(file, data.description, "description");
  }
  inspectDirectory(join(root, ".agents"));
  for (const path of markdown) {
    const file = resolve(root, path);
    try {
      checkLinks(file, remark().parse(readFileSync(file, "utf8")));
    } catch (error) {
      report(file, error.message);
    }
  }
  if (!errors.length) {
    console.log(
      `Harness valid: ${skills.length} skills; ${markdown.length} Markdown files checked.`
    );
  }
} catch (error) {
  errors.push(error.message);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
}
