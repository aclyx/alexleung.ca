#!/usr/bin/env node
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

import matter from "gray-matter";
import prettier from "prettier";

const repoRoot = process.cwd();
const postsDir = path.join(repoRoot, "content", "posts");
const publicDir = path.join(repoRoot, "public");
const imageVariantManifestPath = path.join(
  repoRoot,
  "src",
  "generated",
  "imageVariantManifest.json"
);
const args = new Set(process.argv.slice(2));
const stagedOnly = args.has("--staged");
const stageGenerated = args.has("--stage-generated");

const coverVariantProfiles = {
  card: [
    {
      name: "card-sm",
      width: process.env.COVER_CARD_SM_WIDTH || "480",
      quality: process.env.COVER_CARD_SM_QUALITY || "66",
    },
    {
      name: "card-md",
      width: process.env.COVER_CARD_MD_WIDTH || "640",
      quality: process.env.COVER_CARD_MD_QUALITY || "70",
    },
    {
      name: "card",
      width: process.env.COVER_CARD_WIDTH || "768",
      quality: process.env.COVER_CARD_QUALITY || "72",
    },
  ],
  hero: [
    {
      name: "hero-sm",
      width: process.env.COVER_HERO_SM_WIDTH || "640",
      quality: process.env.COVER_HERO_SM_QUALITY || "68",
    },
    {
      name: "hero",
      width: process.env.COVER_HERO_WIDTH || "1280",
      quality: process.env.COVER_HERO_QUALITY || "75",
    },
  ],
};

const coverVariants = Object.values(coverVariantProfiles).flat();

const inlineContentVariantProfile = [
  {
    name: "content-sm",
    width: process.env.CONTENT_IMAGE_SM_WIDTH || "640",
    quality: process.env.CONTENT_IMAGE_SM_QUALITY || "68",
  },
  {
    name: "content",
    width: process.env.CONTENT_IMAGE_WIDTH || "1024",
    quality: process.env.CONTENT_IMAGE_QUALITY || "72",
  },
];

const inlineImageVariants = inlineContentVariantProfile;

const staticAssetVariants = [
  {
    source: "/assets/background.webp",
    variants: [
      {
        name: "mobile",
        width: process.env.BACKGROUND_MOBILE_WIDTH || "768",
        quality: process.env.BACKGROUND_MOBILE_QUALITY || "64",
      },
      {
        name: "tablet",
        width: process.env.BACKGROUND_TABLET_WIDTH || "1280",
        quality: process.env.BACKGROUND_TABLET_QUALITY || "68",
      },
      {
        name: "desktop",
        width: process.env.BACKGROUND_DESKTOP_WIDTH || "1600",
        quality: process.env.BACKGROUND_DESKTOP_QUALITY || "72",
      },
    ],
  },
  {
    source: "/assets/about_portrait.webp",
    variants: [
      {
        name: "sm",
        width: process.env.ABOUT_PORTRAIT_SM_WIDTH || "480",
        quality: process.env.ABOUT_PORTRAIT_SM_QUALITY || "66",
      },
      {
        name: "md",
        width: process.env.ABOUT_PORTRAIT_MD_WIDTH || "900",
        quality: process.env.ABOUT_PORTRAIT_MD_QUALITY || "70",
      },
      {
        name: "lg",
        width: process.env.ABOUT_PORTRAIT_LG_WIDTH || "1280",
        quality: process.env.ABOUT_PORTRAIT_LG_QUALITY || "74",
      },
    ],
  },
];

function readUint24LE(buffer, offset) {
  return (
    buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16)
  );
}

function getWebpDimensions(buffer) {
  if (
    buffer.length < 16 ||
    buffer.toString("ascii", 0, 4) !== "RIFF" ||
    buffer.toString("ascii", 8, 12) !== "WEBP"
  ) {
    return undefined;
  }

  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const chunkType = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const chunkStart = offset + 8;

    if (chunkType === "VP8X" && chunkStart + 10 <= buffer.length) {
      const width = readUint24LE(buffer, chunkStart + 4) + 1;
      const height = readUint24LE(buffer, chunkStart + 7) + 1;
      return { width, height };
    }

    if (chunkType === "VP8 " && chunkStart + 10 <= buffer.length) {
      const width = buffer.readUInt16LE(chunkStart + 6) & 0x3fff;
      const height = buffer.readUInt16LE(chunkStart + 8) & 0x3fff;
      return { width, height };
    }

    if (chunkType === "VP8L" && chunkStart + 5 <= buffer.length) {
      const b0 = buffer[chunkStart + 1];
      const b1 = buffer[chunkStart + 2];
      const b2 = buffer[chunkStart + 3];
      const b3 = buffer[chunkStart + 4];
      const width = 1 + (((b1 & 0x3f) << 8) | b0);
      const height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
      return { width, height };
    }

    offset = chunkStart + chunkSize + (chunkSize % 2);
  }

  return undefined;
}

function getPngDimensions(buffer) {
  if (
    buffer.length < 24 ||
    buffer.readUInt32BE(0) !== 0x89504e47 ||
    buffer.toString("ascii", 12, 16) !== "IHDR"
  ) {
    return undefined;
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function getJpegDimensions(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return undefined;
  }

  const sofMarkers = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce,
    0xcf,
  ]);
  let offset = 2;

  while (offset + 4 <= buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    offset += 2;

    if (marker === 0xd9 || marker === 0xda) {
      break;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      continue;
    }
    if (offset + 2 > buffer.length) {
      break;
    }

    const segmentLength = buffer.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > buffer.length) {
      break;
    }

    if (sofMarkers.has(marker) && offset + 7 <= buffer.length) {
      return {
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5),
      };
    }

    offset += segmentLength;
  }

  return undefined;
}

function getImageDimensions(imagePath) {
  if (!fs.existsSync(imagePath)) {
    return undefined;
  }

  const extension = path.extname(imagePath).toLowerCase();
  const buffer = fs.readFileSync(imagePath);

  if (extension === ".webp") {
    return getWebpDimensions(buffer);
  }
  if (extension === ".png") {
    return getPngDimensions(buffer);
  }
  if (extension === ".jpg" || extension === ".jpeg") {
    return getJpegDimensions(buffer);
  }

  return undefined;
}

function log(message) {
  process.stdout.write(`${message}\n`);
}

function warn(message) {
  process.stderr.write(`${message}\n`);
}

function hasCommand(command) {
  try {
    execFileSync("which", [command], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function normalizePublicPath(inputPath) {
  if (typeof inputPath !== "string") {
    return undefined;
  }

  const normalizedInput = inputPath.trim().replace(/\\/g, "/");
  if (!normalizedInput) {
    return undefined;
  }

  if (/^(?:[a-z]+:)?\/\//i.test(normalizedInput)) {
    return undefined;
  }

  const candidate = normalizedInput.startsWith("/")
    ? normalizedInput
    : `/${normalizedInput}`;

  if (candidate.split("/").includes("..")) {
    return undefined;
  }

  const normalizedPath = path.posix.normalize(candidate);
  if (
    !normalizedPath.startsWith("/") ||
    normalizedPath === "/" ||
    normalizedPath.includes("\0")
  ) {
    return undefined;
  }

  return normalizedPath;
}

function resolvePublicAbsolutePath(publicPath) {
  const absolutePath = path.resolve(publicDir, `.${publicPath}`);
  const relativeToPublicDir = path.relative(publicDir, absolutePath);

  if (
    relativeToPublicDir.startsWith("..") ||
    path.isAbsolute(relativeToPublicDir)
  ) {
    throw new Error(
      `[image:variants] Unsafe public path resolved outside /public: ${publicPath}`
    );
  }

  return absolutePath;
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

function getAllPostFiles() {
  if (!fs.existsSync(postsDir)) {
    return [];
  }

  return fs
    .readdirSync(postsDir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => path.join("content", "posts", file));
}

function getPostMatter(postFile) {
  const fullPath = path.join(repoRoot, postFile);
  if (!fs.existsSync(fullPath)) {
    return undefined;
  }

  const source = fs.readFileSync(fullPath, "utf8");
  return matter(source);
}

function getCoverImageFromPost(postFile) {
  const parsed = getPostMatter(postFile);
  if (!parsed) {
    return undefined;
  }

  const frontMatter = parsed.data || {};
  if (typeof frontMatter.coverImage !== "string" || !frontMatter.coverImage) {
    return undefined;
  }

  const normalizedCoverImage = normalizePublicPath(frontMatter.coverImage);
  if (!normalizedCoverImage) {
    warn(
      `[image:variants] Skipping unsafe coverImage in ${postFile}: ${frontMatter.coverImage}`
    );
  }

  return normalizedCoverImage;
}

function extractMarkdownImagePaths(markdown) {
  const imagePaths = new Set();
  const imageRegex = /!\[[^\]]*]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
  let match;

  while ((match = imageRegex.exec(markdown)) !== null) {
    const rawPath = match[1]?.trim();
    if (!rawPath || /^(?:[a-z]+:)?\/\//i.test(rawPath)) {
      continue;
    }

    const normalizedPath = normalizePublicPath(rawPath);
    if (!normalizedPath) {
      warn(`[image:variants] Skipping unsafe inline image path: ${rawPath}`);
      continue;
    }

    imagePaths.add(normalizedPath);
  }

  return imagePaths;
}

function getInlineImagesFromPost(postFile) {
  const parsed = getPostMatter(postFile);
  if (!parsed) {
    return new Set();
  }

  return extractMarkdownImagePaths(parsed.content || "");
}

function getStagedPublicFiles(stagedFiles) {
  return new Set(
    [...stagedFiles]
      .filter((file) => file.startsWith("public/"))
      .map((file) => normalizePublicPath(file.slice("public/".length)))
      .filter(Boolean)
  );
}

function resolveCoverImages({ stagedFiles, stagedPublicFiles }) {
  const allPostFiles = getAllPostFiles();

  if (!stagedOnly) {
    return new Set(
      allPostFiles
        .map((postFile) => getCoverImageFromPost(postFile))
        .filter(Boolean)
    );
  }

  const stagedPostFiles = [...stagedFiles].filter(
    (file) => file.startsWith("content/posts/") && file.endsWith(".md")
  );

  const coverImages = new Set();

  for (const postFile of stagedPostFiles) {
    const coverImage = getCoverImageFromPost(postFile);
    if (coverImage) {
      coverImages.add(coverImage);
    }
  }

  if (stagedPublicFiles.size > 0) {
    for (const postFile of allPostFiles) {
      const coverImage = getCoverImageFromPost(postFile);
      if (coverImage && stagedPublicFiles.has(coverImage)) {
        coverImages.add(coverImage);
      }
    }
  }

  return coverImages;
}

function resolveInlineImages({ stagedFiles, stagedPublicFiles }) {
  const allPostFiles = getAllPostFiles();

  if (!stagedOnly) {
    const images = new Set();
    for (const postFile of allPostFiles) {
      for (const imagePath of getInlineImagesFromPost(postFile)) {
        images.add(imagePath);
      }
    }
    return images;
  }

  const stagedPostFiles = [...stagedFiles].filter(
    (file) => file.startsWith("content/posts/") && file.endsWith(".md")
  );
  const inlineImages = new Set();

  for (const postFile of stagedPostFiles) {
    for (const imagePath of getInlineImagesFromPost(postFile)) {
      inlineImages.add(imagePath);
    }
  }

  if (stagedPublicFiles.size > 0) {
    for (const postFile of allPostFiles) {
      for (const imagePath of getInlineImagesFromPost(postFile)) {
        if (stagedPublicFiles.has(imagePath)) {
          inlineImages.add(imagePath);
        }
      }
    }
  }

  return inlineImages;
}

function resolveStaticAssets({ stagedPublicFiles }) {
  if (!stagedOnly) {
    return staticAssetVariants.map((asset) => asset.source);
  }

  return staticAssetVariants
    .filter((asset) => stagedPublicFiles.has(asset.source))
    .map((asset) => asset.source);
}

function createSourceVariantCandidates() {
  const sourceVariantCandidates = new Map();
  const addCandidates = (sourcePath, variants) => {
    const existing = sourceVariantCandidates.get(sourcePath) || [];
    sourceVariantCandidates.set(sourcePath, [...existing, ...variants]);
  };

  const allPostFiles = getAllPostFiles();
  const coverSources = new Set();
  const inlineSources = new Set();

  for (const postFile of allPostFiles) {
    const coverImage = getCoverImageFromPost(postFile);
    if (coverImage) {
      coverSources.add(coverImage);
    }

    for (const imagePath of getInlineImagesFromPost(postFile)) {
      inlineSources.add(imagePath);
    }
  }

  for (const sourcePath of coverSources) {
    addCandidates(sourcePath, coverVariants);
  }

  for (const sourcePath of inlineSources) {
    addCandidates(sourcePath, inlineImageVariants);
  }

  for (const asset of staticAssetVariants) {
    addCandidates(asset.source, asset.variants);
  }

  return sourceVariantCandidates;
}

function buildImageVariantManifest() {
  const sourceVariantCandidates = createSourceVariantCandidates();
  const sources = {};

  for (const [sourcePath, variants] of [
    ...sourceVariantCandidates.entries(),
  ].sort((a, b) => a[0].localeCompare(b[0]))) {
    const normalizedVariants = {};
    for (const variant of variants) {
      const variantPath = toVariantPath(sourcePath, variant.name);
      const absoluteVariantPath = resolvePublicAbsolutePath(variantPath);
      if (!fs.existsSync(absoluteVariantPath)) {
        continue;
      }

      const dimensions = getImageDimensions(absoluteVariantPath);
      if (!dimensions) {
        continue;
      }

      normalizedVariants[variant.name] = {
        path: variantPath,
        width: dimensions.width,
        height: dimensions.height,
      };
    }

    if (Object.keys(normalizedVariants).length > 0) {
      sources[sourcePath] = {
        variants: Object.fromEntries(
          Object.entries(normalizedVariants).sort((a, b) =>
            a[0].localeCompare(b[0])
          )
        ),
      };
    }
  }

  return {
    schemaVersion: 1,
    profiles: {
      cover: Object.fromEntries(
        Object.entries(coverVariantProfiles).map(([profileName, variants]) => [
          profileName,
          variants.map((variant) => variant.name),
        ])
      ),
      inlineContent: inlineContentVariantProfile.map((variant) => variant.name),
    },
    sources,
  };
}

async function writeImageVariantManifest() {
  const manifest = buildImageVariantManifest();
  const serializedManifest = `${JSON.stringify(manifest, null, 2)}\n`;
  let output = serializedManifest;

  try {
    const prettierConfig =
      (await prettier.resolveConfig(imageVariantManifestPath)) || {};
    output = await prettier.format(serializedManifest, {
      ...prettierConfig,
      filepath: imageVariantManifestPath,
      parser: "json",
    });
  } catch (error) {
    warn(
      `[image:variants] Failed to format manifest with Prettier, writing unformatted JSON instead: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  fs.mkdirSync(path.dirname(imageVariantManifestPath), { recursive: true });
  fs.writeFileSync(imageVariantManifestPath, output, "utf8");

  return path.relative(repoRoot, imageVariantManifestPath);
}

function toVariantPath(sourcePublicPath, variantName) {
  if (/\.(webp|jpe?g|png)$/i.test(sourcePublicPath)) {
    return sourcePublicPath.replace(
      /\.(webp|jpe?g|png)$/i,
      `-${variantName}.webp`
    );
  }

  return `${sourcePublicPath}-${variantName}.webp`;
}

function generateVariant(sourcePath, targetPath, variant) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  execFileSync(
    "cwebp",
    [
      "-quiet",
      "-q",
      variant.quality,
      "-resize",
      variant.width,
      "0",
      sourcePath,
      "-o",
      targetPath,
    ],
    { stdio: "inherit" }
  );
}

function generateVariantsForSources({ sources, variants, generated, label }) {
  if (sources.size === 0) {
    return;
  }

  for (const sourcePublicPath of sources) {
    const sourcePath = resolvePublicAbsolutePath(sourcePublicPath);
    if (!fs.existsSync(sourcePath)) {
      warn(`[image:variants] Missing source image (${label}): ${sourcePath}`);
      continue;
    }

    for (const variant of variants) {
      const targetPublicPath = toVariantPath(sourcePublicPath, variant.name);
      const targetPath = resolvePublicAbsolutePath(targetPublicPath);
      generateVariant(sourcePath, targetPath, variant);
      generated.push(path.relative(repoRoot, targetPath));
    }
  }
}

async function run() {
  const canGenerateVariants = hasCommand("cwebp");
  if (!canGenerateVariants) {
    warn(
      "[image:variants] Skipping variant generation: `cwebp` not found on PATH. Build will continue with original sources."
    );
  }

  const stagedFiles = stagedOnly ? getStagedFiles() : new Set();
  const stagedPublicFiles = getStagedPublicFiles(stagedFiles);
  const coverImages = resolveCoverImages({ stagedFiles, stagedPublicFiles });
  const inlineImages = resolveInlineImages({ stagedFiles, stagedPublicFiles });
  const staticSources = resolveStaticAssets({ stagedPublicFiles });

  const generated = [];
  const staticVariantMap = new Map(
    staticAssetVariants.map((asset) => [asset.source, asset.variants])
  );

  if (canGenerateVariants) {
    generateVariantsForSources({
      sources: coverImages,
      variants: coverVariants,
      generated,
      label: "cover",
    });

    generateVariantsForSources({
      sources: inlineImages,
      variants: inlineImageVariants,
      generated,
      label: "inline",
    });

    for (const sourcePublicPath of staticSources) {
      const sourcePath = resolvePublicAbsolutePath(sourcePublicPath);
      if (!fs.existsSync(sourcePath)) {
        warn(`[image:variants] Missing source image (static): ${sourcePath}`);
        continue;
      }

      const variants = staticVariantMap.get(sourcePublicPath) || [];
      for (const variant of variants) {
        const targetPublicPath = toVariantPath(sourcePublicPath, variant.name);
        const targetPath = resolvePublicAbsolutePath(targetPublicPath);
        generateVariant(sourcePath, targetPath, variant);
        generated.push(path.relative(repoRoot, targetPath));
      }
    }
  }

  const manifestPath = await writeImageVariantManifest();
  generated.push(manifestPath);

  if (stageGenerated && generated.length > 0) {
    execFileSync("git", ["add", ...generated], {
      cwd: repoRoot,
      stdio: "inherit",
    });
  }

  log(
    `[image:variants] Generated ${generated.length - 1} variant(s) and wrote ${manifestPath}.`
  );
}

run().catch((error) => {
  warn(
    `[image:variants] Failed: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exitCode = 1;
});
