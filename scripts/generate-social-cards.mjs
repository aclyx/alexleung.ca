#!/usr/bin/env node
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

import matter from "gray-matter";
import sharp from "sharp";

const repoRoot = process.cwd();
const postsDir = path.join(repoRoot, "content", "posts");
const substratePath = path.join(
  repoRoot,
  "public",
  "assets",
  "social-cards",
  "substrate.webp"
);
const outputDir = path.join(
  repoRoot,
  "public",
  "assets",
  "social-cards",
  "blog"
);
const args = new Set(process.argv.slice(2));
const stagedOnly = args.has("--staged");
const stageGenerated = args.has("--stage-generated");
const socialCardWidth = 1200;
const socialCardHeight = 630;

function log(message) {
  process.stdout.write(`${message}\n`);
}

function getStagedFiles() {
  try {
    const output = execFileSync(
      "git",
      ["diff", "--cached", "--name-only", "--diff-filter=ACMR"],
      {
        cwd: repoRoot,
        encoding: "utf8",
      }
    );

    return new Set(
      output
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
    );
  } catch {
    return new Set();
  }
}

function getPostFiles(stagedFiles) {
  if (!fs.existsSync(postsDir)) {
    return [];
  }

  const allPostFiles = fs
    .readdirSync(postsDir)
    .filter((file) => file.endsWith(".md"))
    .sort();

  if (!stagedOnly) {
    return allPostFiles;
  }

  const generatorInputsChanged = [
    "scripts/generate-social-cards.mjs",
    "public/assets/social-cards/substrate.webp",
  ].some((file) => stagedFiles.has(file));

  if (generatorInputsChanged) {
    return allPostFiles;
  }

  return allPostFiles.filter((file) =>
    stagedFiles.has(path.posix.join("content", "posts", file))
  );
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function visualLength(value) {
  let length = 0;

  for (const character of value) {
    if (" ilI1.,'`".includes(character)) {
      length += 0.45;
    } else if ("MW@%&".includes(character)) {
      length += 1.35;
    } else {
      length += 1;
    }
  }

  return length;
}

function wrapTitle(title, maxLineLength) {
  const words = title.trim().split(/\s+/);
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;

    if (currentLine && visualLength(candidate) > maxLineLength) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = candidate;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function getTitleLayout(title) {
  const layouts = [
    { fontSize: 62, lineHeight: 70, maxLineLength: 29 },
    { fontSize: 56, lineHeight: 64, maxLineLength: 33 },
    { fontSize: 50, lineHeight: 58, maxLineLength: 37 },
  ];

  for (const layout of layouts) {
    const lines = wrapTitle(title, layout.maxLineLength);
    if (lines.length <= 3) {
      return { ...layout, lines };
    }
  }

  throw new Error(`Post title is too long for social card: ${title}`);
}

function formatDate(date) {
  const parsedDate = new Date(`${date}T00:00:00Z`);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(`Invalid post date for social card: ${date}`);
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsedDate);
}

function createOverlay({ title, date, category }) {
  const { fontSize, lineHeight, lines } = getTitleLayout(title);
  const lastBaseline = 536;
  const firstBaseline = lastBaseline - lineHeight * (lines.length - 1);
  const eyebrowBaseline = firstBaseline - 48;
  const titleLines = lines
    .map(
      (line, index) =>
        `<tspan x="92" y="${firstBaseline + index * lineHeight}">${escapeXml(line)}</tspan>`
    )
    .join("");

  return Buffer.from(`
    <svg width="${socialCardWidth}" height="${socialCardHeight}" viewBox="0 0 ${socialCardWidth} ${socialCardHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${socialCardWidth}" height="${socialCardHeight}" fill="#020617" fill-opacity="0.2" />
      <text x="92" y="92" fill="#f8fafc" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700">alexleung.ca</text>
      <text x="1108" y="92" text-anchor="end" fill="#fbbf24" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700">WRITING</text>
      <line x1="92" y1="124" x2="1108" y2="124" stroke="#e2e8f0" stroke-opacity="0.25" stroke-width="2" />
      <text x="92" y="${eyebrowBaseline}" fill="#cbd5e1" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="400">${escapeXml(category)} / ${escapeXml(formatDate(date))}</text>
      <text fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="700">${titleLines}</text>
    </svg>
  `);
}

async function generateCard(postFile) {
  const slug = path.basename(postFile, ".md");
  const source = fs.readFileSync(path.join(postsDir, postFile), "utf8");
  const { data } = matter(source);

  if (data.draft === true) {
    return undefined;
  }

  if (typeof data.title !== "string" || typeof data.date !== "string") {
    throw new Error(`Missing title or date in ${postFile}`);
  }

  const category =
    Array.isArray(data.tags) && typeof data.tags[0] === "string"
      ? data.tags[0]
      : "Writing";
  const background = await sharp(substratePath)
    .resize(socialCardWidth, socialCardHeight, {
      fit: "cover",
      position: "centre",
    })
    .toBuffer();
  const outputPath = path.join(outputDir, `${slug}.webp`);

  fs.mkdirSync(outputDir, { recursive: true });
  await sharp(background)
    .composite([
      {
        input: createOverlay({
          title: data.title,
          date: data.date,
          category,
        }),
      },
    ])
    .webp({ quality: 84 })
    .toFile(outputPath);

  return path.relative(repoRoot, outputPath);
}

async function run() {
  if (!fs.existsSync(substratePath)) {
    throw new Error(`Missing social card substrate: ${substratePath}`);
  }

  const stagedFiles = stagedOnly ? getStagedFiles() : new Set();
  const postFiles = getPostFiles(stagedFiles);
  const generated = (
    await Promise.all(postFiles.map((postFile) => generateCard(postFile)))
  ).filter(Boolean);

  if (stageGenerated && generated.length > 0) {
    execFileSync("git", ["add", ...generated], {
      cwd: repoRoot,
      stdio: "inherit",
    });
  }

  log(`[social:cards] Generated ${generated.length} blog social card(s).`);
}

run().catch((error) => {
  process.stderr.write(
    `[social:cards] Failed: ${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exitCode = 1;
});
