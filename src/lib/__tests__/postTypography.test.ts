import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const postsDirectory = join(process.cwd(), "content/posts");

// The Markdown pipeline renders quotes as typed, so prose must use curly ones.
// Code, math, link targets, and HTML keep straight quotes.
function findStraightQuotes(source: string): string[] {
  const body = source.replace(/^---\n[\s\S]*?\n---\n/, "");
  const findings: string[] = [];
  let inFence = false;

  body.split("\n").forEach((line, index) => {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;

    const prose = line
      .replace(/`[^`]*`/g, "")
      .replace(/\$[^$]*\$/g, "")
      .replace(/\]\([^)]*\)/g, "]")
      .replace(/<[^>]*>/g, "");

    if (/["']/.test(prose)) {
      findings.push(`body line ${index + 1}: ${line.trim()}`);
    }
  });

  return findings;
}

describe("post typography", () => {
  const files = readdirSync(postsDirectory).filter((file) =>
    file.endsWith(".md")
  );

  it.each(files)("%s uses curly quotes in prose", (file) => {
    const source = readFileSync(join(postsDirectory, file), "utf8");

    expect(findStraightQuotes(source)).toEqual([]);
  });

  it("ignores code, math, and link targets", () => {
    const source = [
      "---",
      'title: "It\'s fine in frontmatter"',
      "---",
      "Use `don't` and $f'(x)$ with [a link](https://example.com/?q='x').",
      "```ts",
      'const quote = "straight";',
      "```",
    ].join("\n");

    expect(findStraightQuotes(source)).toEqual([]);
    expect(findStraightQuotes("---\n---\nThe site's prose.")).toHaveLength(1);
  });
});
