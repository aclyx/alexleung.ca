#!/usr/bin/env node
import fs from "fs";
import path from "path";

const repoRoot = process.cwd();
const snapshotsPath = path.join(
  repoRoot,
  "src",
  "content",
  "nowSnapshots.json"
);
const nowPagePath = path.join(repoRoot, "src", "app", "now", "page.tsx");

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

function fail(message) {
  process.stderr.write(`[now:timeline] ${message}\n`);
  process.exit(1);
}

function isStrictIsoDate(date) {
  if (!isoDatePattern.test(date)) {
    return false;
  }

  const parsed = new Date(`${date}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.valueOf()) &&
    parsed.toISOString().slice(0, 10) === date
  );
}

function hasText(segments) {
  return (
    Array.isArray(segments) && segments.some((segment) => segment.text?.trim())
  );
}

const snapshots = JSON.parse(fs.readFileSync(snapshotsPath, "utf8"));

if (!Array.isArray(snapshots) || snapshots.length === 0) {
  fail("src/content/nowSnapshots.json must contain at least one snapshot.");
}

const snapshotIds = new Set();
const dates = new Set();
let previousDate = "";

for (const snapshot of snapshots) {
  if (!snapshot.id || snapshotIds.has(snapshot.id)) {
    fail(`Snapshot has missing or duplicate id: ${snapshot.id ?? "(missing)"}`);
  }
  snapshotIds.add(snapshot.id);

  if (!snapshot.date || !isStrictIsoDate(snapshot.date)) {
    fail(
      `Snapshot ${snapshot.id} has invalid date: ${snapshot.date ?? "(missing)"}`
    );
  }
  if (dates.has(snapshot.date)) {
    fail(`Duplicate snapshot date: ${snapshot.date}`);
  }
  dates.add(snapshot.date);

  if (previousDate && snapshot.date > previousDate) {
    fail("Snapshots must be sorted newest first.");
  }
  previousDate = snapshot.date;

  if (!Array.isArray(snapshot.sections) || snapshot.sections.length === 0) {
    fail(`Snapshot ${snapshot.id} must have at least one section.`);
  }

  const sectionIds = new Set();
  for (const section of snapshot.sections) {
    if (!section.id || !section.icon || !section.title) {
      fail(`Snapshot ${snapshot.id} has an incomplete section.`);
    }
    if (sectionIds.has(section.id)) {
      fail(`Snapshot ${snapshot.id} has duplicate section id ${section.id}.`);
    }
    sectionIds.add(section.id);

    if (!Array.isArray(section.blocks) || section.blocks.length === 0) {
      fail(`Section ${snapshot.id}/${section.id} must have blocks.`);
    }

    const blockIds = new Set();
    for (const block of section.blocks) {
      if (!block.id || blockIds.has(block.id)) {
        fail(
          `Section ${snapshot.id}/${section.id} has missing or duplicate block id.`
        );
      }
      blockIds.add(block.id);

      if (block.type === "paragraph") {
        if (!hasText(block.segments)) {
          fail(
            `Paragraph ${snapshot.id}/${section.id}/${block.id} must contain text.`
          );
        }
        continue;
      }

      if (block.type === "list") {
        if (!Array.isArray(block.items) || block.items.length === 0) {
          fail(
            `List ${snapshot.id}/${section.id}/${block.id} must contain items.`
          );
        }
        for (const item of block.items) {
          if (!item.id || !hasText(item.segments)) {
            fail(
              `List ${snapshot.id}/${section.id}/${block.id} has an incomplete item.`
            );
          }
        }
        continue;
      }

      fail(`Unsupported block type: ${block.type}`);
    }
  }
}

const nowPage = fs.readFileSync(nowPagePath, "utf8");
if (
  !nowPage.includes("latestNowSnapshot") ||
  !nowPage.includes("NowSnapshotContent")
) {
  fail(
    "src/app/now/page.tsx must render from latestNowSnapshot via NowSnapshotContent."
  );
}

process.stdout.write(
  `[now:timeline] Validated ${snapshots.length} Now snapshot(s).\n`
);
