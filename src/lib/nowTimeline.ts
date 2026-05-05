import { z } from "zod";

import rawNowSnapshots from "@/content/nowSnapshots.json";
import { formatIsoDateForDisplay } from "@/lib/date";

const nowTextSegmentSchema = z.object({
  text: z.string(),
  href: z.string().optional(),
  emphasis: z.boolean().optional(),
});

const nowParagraphBlockSchema = z.object({
  id: z.string(),
  type: z.literal("paragraph"),
  segments: z.array(nowTextSegmentSchema).min(1),
});

const nowListBlockSchema = z.object({
  id: z.string(),
  type: z.literal("list"),
  items: z
    .array(
      z.object({
        id: z.string(),
        segments: z.array(nowTextSegmentSchema).min(1),
      })
    )
    .min(1),
});

const nowBlockSchema = z.discriminatedUnion("type", [
  nowParagraphBlockSchema,
  nowListBlockSchema,
]);

const nowSectionSchema = z.object({
  id: z.string(),
  icon: z.string(),
  title: z.string(),
  blocks: z.array(nowBlockSchema).min(1),
});

const nowSnapshotSchema = z.object({
  id: z.string(),
  date: z.string(),
  summary: z.string().optional(),
  sections: z.array(nowSectionSchema).min(1),
});

const nowSnapshotsSchema = z.array(nowSnapshotSchema).min(1);

export type NowTextSegment = z.infer<typeof nowTextSegmentSchema>;
export type NowSnapshot = z.infer<typeof nowSnapshotSchema>;

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

function isStrictIsoDate(date: string) {
  if (!isoDatePattern.test(date)) {
    return false;
  }

  const parsed = new Date(`${date}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.valueOf()) &&
    parsed.toISOString().slice(0, 10) === date
  );
}

function hasText(segments: NowTextSegment[]) {
  return segments.some((segment) => segment.text.trim().length > 0);
}

export function validateNowSnapshots(input: unknown): NowSnapshot[] {
  const snapshots = nowSnapshotsSchema.parse(input);

  const snapshotIds = new Set<string>();
  const dates = new Set<string>();
  let previousDate = "";

  return snapshots.map((snapshot) => {
    if (snapshotIds.has(snapshot.id)) {
      throw new Error(`Duplicate Now snapshot id: ${snapshot.id}`);
    }
    snapshotIds.add(snapshot.id);

    if (!isStrictIsoDate(snapshot.date)) {
      throw new Error(`Invalid Now snapshot date: ${snapshot.date}`);
    }
    if (dates.has(snapshot.date)) {
      throw new Error(`Duplicate Now snapshot date: ${snapshot.date}`);
    }
    dates.add(snapshot.date);

    if (previousDate && snapshot.date > previousDate) {
      throw new Error("nowSnapshots must be sorted newest first");
    }
    previousDate = snapshot.date;

    const sectionIds = new Set<string>();
    for (const section of snapshot.sections) {
      if (!section.id || !section.title || !section.icon) {
        throw new Error(
          `Now snapshot ${snapshot.id} has an incomplete section`
        );
      }
      if (sectionIds.has(section.id)) {
        throw new Error(
          `Duplicate section id in ${snapshot.id}: ${section.id}`
        );
      }
      sectionIds.add(section.id);

      const blockIds = new Set<string>();
      for (const block of section.blocks) {
        if (!block.id || blockIds.has(block.id)) {
          throw new Error(
            `Duplicate or missing block id in ${snapshot.id}/${section.id}`
          );
        }
        blockIds.add(block.id);

        if (block.type === "paragraph") {
          if (!Array.isArray(block.segments) || !hasText(block.segments)) {
            throw new Error(`Paragraph ${block.id} must contain text`);
          }
          continue;
        }

        if (block.type === "list") {
          if (!Array.isArray(block.items) || block.items.length === 0) {
            throw new Error(`List ${block.id} must contain items`);
          }
          for (const item of block.items) {
            if (
              !item.id ||
              !Array.isArray(item.segments) ||
              !hasText(item.segments)
            ) {
              throw new Error(`List ${block.id} has an incomplete item`);
            }
          }
          continue;
        }

        throw new Error(
          `Unsupported Now block type in ${snapshot.id}/${section.id}`
        );
      }
    }

    return snapshot;
  });
}

export const nowSnapshots = validateNowSnapshots(rawNowSnapshots);
export const latestNowSnapshot = nowSnapshots[0];
export const NOW_PAGE_LAST_UPDATED_ISO = latestNowSnapshot.date;

export function formatNowSnapshotDate(date: string) {
  return formatIsoDateForDisplay(date);
}
