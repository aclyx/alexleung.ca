import { isFrameActive } from "@/features/event-loop/model/scheduler";
import { Frame } from "@/features/event-loop/types";

type CallStackPanelProps = {
  frames: Frame[];
};

function formatFrameProgress(frame: Frame): string {
  if (!isFrameActive(frame)) {
    return "complete";
  }

  return `next op ${frame.cursor + 1}/${frame.operations.length}`;
}

export function CallStackPanel({ frames }: CallStackPanelProps) {
  return (
    <section className="rounded-lg border border-gray-700 bg-gray-900/70 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-200">
        Call stack
      </h3>
      <p className="mt-1 text-xs text-gray-400">
        Top frame is the currently executing function/context.
      </p>
      <ol className="mt-3 space-y-2">
        {frames.length === 0 ? (
          <li className="rounded border border-dashed border-gray-700 p-2 text-xs text-gray-500">
            Stack is empty.
          </li>
        ) : (
          [...frames].reverse().map((frame, index) => (
            <li
              key={frame.id}
              className={`rounded border p-2 ${
                index === 0
                  ? "border-sky-500 bg-sky-900/20"
                  : "border-gray-700 bg-gray-800/60"
              }`}
            >
              <p className="text-sm text-white">{frame.label}</p>
              <p className="text-xs text-gray-300">
                source: {frame.source} • {formatFrameProgress(frame)} •{" "}
                {isFrameActive(frame) ? "active" : "done"}
              </p>
            </li>
          ))
        )}
      </ol>
    </section>
  );
}
