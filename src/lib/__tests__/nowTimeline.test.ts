import {
  formatNowSnapshotDate,
  latestNowSnapshot,
  nowSnapshots,
  validateNowSnapshots,
} from "@/lib/nowTimeline";

describe("nowTimeline", () => {
  it("selects the newest snapshot as the latest snapshot", () => {
    expect(latestNowSnapshot).toBe(nowSnapshots[0]);
    expect(latestNowSnapshot.date).toBe("2026-05-01");
  });

  it("formats snapshot dates in UTC", () => {
    expect(formatNowSnapshotDate("2026-05-01")).toBe("May 1, 2026");
  });

  it("rejects invalid dates and duplicate block ids", () => {
    expect(() =>
      validateNowSnapshots([
        {
          id: "now-invalid",
          date: "2026-02-31",
          sections: [
            {
              id: "top-of-mind",
              icon: "•",
              title: "Top of Mind",
              blocks: [
                {
                  id: "duplicate",
                  type: "paragraph",
                  segments: [{ text: "One" }],
                },
                {
                  id: "duplicate",
                  type: "paragraph",
                  segments: [{ text: "Two" }],
                },
              ],
            },
          ],
        },
      ])
    ).toThrow(/Invalid Now snapshot date/);

    expect(() =>
      validateNowSnapshots([
        {
          id: "now-valid",
          date: "2026-02-28",
          sections: [
            {
              id: "top-of-mind",
              icon: "•",
              title: "Top of Mind",
              blocks: [
                {
                  id: "duplicate",
                  type: "paragraph",
                  segments: [{ text: "One" }],
                },
                {
                  id: "duplicate",
                  type: "paragraph",
                  segments: [{ text: "Two" }],
                },
              ],
            },
          ],
        },
      ])
    ).toThrow(/Duplicate or missing block id/);
  });

  it("keeps snapshot and section ids unique", () => {
    const snapshotIds = new Set(nowSnapshots.map((snapshot) => snapshot.id));
    expect(snapshotIds.size).toBe(nowSnapshots.length);

    for (const snapshot of nowSnapshots) {
      const sectionIds = new Set(
        snapshot.sections.map((section) => section.id)
      );
      expect(sectionIds.size).toBe(snapshot.sections.length);
    }
  });
});
