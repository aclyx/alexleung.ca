#!/usr/bin/env node
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

const repoRoot = process.cwd();
const nowPagePath = "src/app/now/page.tsx";
const outputPath = path.join(repoRoot, "src", "content", "nowSnapshots.json");

function git(args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 20,
  });
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&amp;/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function decodeEntities(value) {
  return value
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function cleanText(value) {
  return decodeEntities(
    value
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
      .replace(/\{"\s*"\}/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function stripTags(value) {
  return cleanText(value.replace(/<[^>]+>/g, " "));
}

function segmentFromPlainText(text) {
  const clean = stripTags(text);
  return clean ? [{ text: clean }] : [];
}

function parseInlineSegments(raw) {
  const segments = [];
  const tokenPattern =
    /<(?:ExternalLink|Link)\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/(?:ExternalLink|Link)>|<em>([\s\S]*?)<\/em>/g;
  let lastIndex = 0;
  let match;

  while ((match = tokenPattern.exec(raw))) {
    const before = raw.slice(lastIndex, match.index);
    const beforeText = stripTags(before);
    if (beforeText) {
      segments.push({ text: beforeText });
    }

    if (match[1]) {
      const linkText = stripTags(match[2]);
      if (linkText) {
        segments.push({
          text: linkText,
          href: match[1],
          ...(match[2].includes("<em>") ? { emphasis: true } : {}),
        });
      }
    } else {
      const emphasizedText = stripTags(match[3]);
      if (emphasizedText) {
        segments.push({ text: emphasizedText, emphasis: true });
      }
    }

    lastIndex = tokenPattern.lastIndex;
  }

  const afterText = stripTags(raw.slice(lastIndex));
  if (afterText) {
    segments.push({ text: afterText });
  }

  return segments;
}

function getSnapshotDate(source, commit) {
  const isoMatch = source.match(
    /NOW_PAGE_LAST_UPDATED_ISO\s*=\s*"(\d{4}-\d{2}-\d{2})"/
  );
  if (isoMatch) {
    return isoMatch[1];
  }

  const visibleMatch = source.match(
    /Last updated:\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})/
  );
  if (visibleMatch) {
    const parsed = new Date(`${visibleMatch[1]} UTC`);
    if (!Number.isNaN(parsed.valueOf())) {
      return parsed.toISOString().slice(0, 10);
    }
  }

  return git(["show", "-s", "--format=%ad", "--date=short", commit]).trim();
}

function parseBlocks(body, sectionId) {
  const blocks = [];
  const blockPattern = /<p[^>]*>([\s\S]*?)<\/p>|<ul[^>]*>([\s\S]*?)<\/ul>/g;
  let match;
  let paragraphCount = 0;
  let listCount = 0;

  while ((match = blockPattern.exec(body))) {
    if (match[1]) {
      const segments = parseInlineSegments(match[1]);
      if (segments.length > 0) {
        paragraphCount += 1;
        blocks.push({
          id: `${sectionId}-paragraph-${paragraphCount}`,
          type: "paragraph",
          segments,
        });
      }
      continue;
    }

    const items = [...match[2].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)]
      .map((itemMatch, index) => ({
        id: `${sectionId}-item-${index + 1}`,
        segments: parseInlineSegments(itemMatch[1]),
      }))
      .filter((item) => item.segments.length > 0);

    if (items.length > 0) {
      listCount += 1;
      blocks.push({
        id: `${sectionId}-list-${listCount}`,
        type: "list",
        items,
      });
    }
  }

  return blocks;
}

function parseIconTextRows(source) {
  return [
    ...source.matchAll(/<IconTextRow\s+([^>]*)>([\s\S]*?)<\/IconTextRow>/g),
  ]
    .map((match) => {
      const props = match[1];
      const icon = props.match(/icon="([^"]+)"/)?.[1] || "•";
      const title = props.match(/title="([^"]+)"/)?.[1];
      if (!title) {
        return undefined;
      }

      const sectionId = slugify(title);
      const blocks = parseBlocks(match[2], sectionId);
      if (blocks.length === 0) {
        return undefined;
      }

      return {
        id: sectionId,
        icon,
        title: decodeEntities(title),
        blocks,
      };
    })
    .filter(Boolean);
}

function parseOlderSections(source) {
  const sectionPattern =
    /<h3[^>]*>\s*([^<]+?)\s*<\/h3>([\s\S]*?)(?=<\/div>\s*<\/div>\s*(?:\{\/\*|<div className="flex)|\{\/\* Footer|<\/section>)/g;

  return [...source.matchAll(sectionPattern)]
    .map((match) => {
      const title = stripTags(match[1]);
      const sectionId = slugify(title);
      const blocks = parseBlocks(match[2], sectionId);

      if (!title || blocks.length === 0) {
        return undefined;
      }

      const iconSource = source.slice(
        Math.max(0, match.index - 300),
        match.index
      );
      const icon =
        iconSource.match(/>\s*([^<\s]{1,3})\s*<\/span>\s*<div>\s*$/)?.[1] ||
        "•";

      return {
        id: sectionId,
        icon,
        title,
        blocks,
      };
    })
    .filter(Boolean);
}

function parseSnapshot(source, commit) {
  const date = getSnapshotDate(source, commit);
  const sections = parseIconTextRows(source);
  const parsedSections =
    sections.length > 0 ? sections : parseOlderSections(source);

  if (parsedSections.length === 0) {
    return undefined;
  }

  return {
    id: `now-${date}`,
    date,
    sections: parsedSections,
  };
}

const commits = git(["log", "--format=%H", "--", nowPagePath])
  .trim()
  .split("\n")
  .filter(Boolean);

const snapshotsByDate = new Map();

for (const commit of commits) {
  let source;
  try {
    source = git(["show", `${commit}:${nowPagePath}`]);
  } catch {
    continue;
  }

  const snapshot = parseSnapshot(source, commit);
  if (!snapshot) {
    continue;
  }

  if (!snapshotsByDate.has(snapshot.date)) {
    snapshotsByDate.set(snapshot.date, snapshot);
  }
}

const snapshots = [...snapshotsByDate.values()].sort((a, b) =>
  a.date < b.date ? 1 : -1
);

if (snapshots.length === 0) {
  throw new Error("Could not backfill any Now snapshots from git history.");
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(snapshots, null, 2)}\n`, "utf8");

process.stdout.write(
  `[now:timeline] Backfilled ${snapshots.length} snapshot(s) to ${path.relative(
    repoRoot,
    outputPath
  )}. Review before committing.\n`
);
