import { NowSnapshotContent } from "@/app/now/_components/NowSnapshotContent";
import { formatNowSnapshotDate, NowSnapshot } from "@/lib/nowTimeline";

type NowTimeCapsuleDrawerProps = {
  snapshots: NowSnapshot[];
};

function formatSnapshotCount(count: number) {
  return count === 1 ? "1 past snapshot" : `${count} past snapshots`;
}

export function NowTimeCapsuleDrawer({ snapshots }: NowTimeCapsuleDrawerProps) {
  if (snapshots.length === 0) {
    return null;
  }

  return (
    <details className="group mt-8 overflow-hidden rounded-lg border border-white/10 bg-slate-950/40 text-left">
      <summary className="text-body-sm flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-gray-300 transition-colors hover:bg-white/[0.03] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-link [&::-webkit-details-marker]:hidden">
        <span className="font-semibold">Time capsule</span>
        <span className="flex items-center gap-3 text-xs text-gray-500 md:text-sm">
          <span>{formatSnapshotCount(snapshots.length)}</span>
          <span
            aria-hidden="true"
            className="grid size-6 place-items-center rounded-full border border-white/10 text-gray-400"
          >
            <span className="group-open:hidden">+</span>
            <span className="hidden group-open:inline">-</span>
          </span>
        </span>
      </summary>

      <div className="border-t border-white/10 px-4 py-4 md:px-5 md:py-5">
        <p className="text-body-sm text-gray-400">
          Older snapshots from this page, kept as dated records instead of
          separate posts.
        </p>

        <ol className="mt-4 space-y-3">
          {snapshots.map((snapshot) => (
            <li key={snapshot.id}>
              <details className="overflow-hidden rounded-md border border-white/10 bg-black/20">
                <summary className="text-body-sm flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-gray-300 transition-colors hover:bg-white/[0.03] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-link [&::-webkit-details-marker]:hidden">
                  <span className="font-semibold">
                    {formatNowSnapshotDate(snapshot.date)}
                  </span>
                  <span aria-hidden="true" className="text-gray-500">
                    +
                  </span>
                </summary>
                <NowSnapshotContent
                  snapshot={snapshot}
                  compact
                  headingLevel="h4"
                  className="border-t border-white/10 px-4 py-4 text-gray-200"
                />
              </details>
            </li>
          ))}
        </ol>
      </div>
    </details>
  );
}
