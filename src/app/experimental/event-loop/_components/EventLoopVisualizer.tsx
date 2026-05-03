"use client";

import { useEffect, useState } from "react";

import { CallStackPanel } from "@/features/event-loop/components/CallStackPanel";
import { QueueColumn } from "@/features/event-loop/components/QueueColumn";
import { TimelinePanel } from "@/features/event-loop/components/TimelinePanel";
import { VisualizerControls } from "@/features/event-loop/components/VisualizerControls";
import {
  EVENT_LOOP_EXAMPLES,
  getExampleById,
} from "@/features/event-loop/model/examples";
import {
  createInitialState,
  stepEventLoop,
} from "@/features/event-loop/model/scheduler";
import { trackExperimentInteraction } from "@/lib/analytics";

const DEFAULT_EXAMPLE_ID = EVENT_LOOP_EXAMPLES[0].id;
const EXPERIMENT_ID = "event_loop_visualizer";

export function EventLoopVisualizer() {
  const [selectedExampleId, setSelectedExampleId] =
    useState(DEFAULT_EXAMPLE_ID);
  const [speedMs, setSpeedMs] = useState(600);
  const [isPlaying, setIsPlaying] = useState(false);

  const selectedExample =
    getExampleById(selectedExampleId) ?? EVENT_LOOP_EXAMPLES[0];

  const [state, setState] = useState(() => createInitialState(selectedExample));

  useEffect(() => {
    setIsPlaying(false);
    setState(createInitialState(selectedExample));
  }, [selectedExample]);

  useEffect(() => {
    if (!isPlaying || state.completed) {
      return;
    }

    const timer = window.setInterval(() => {
      setState((previous) => stepEventLoop(previous));
    }, speedMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [isPlaying, speedMs, state.completed]);

  const activeFrame = state.callStack.at(-1);
  const nextHint = activeFrame
    ? `Executing ${activeFrame.label} on the ${activeFrame.source} queue.`
    : state.microtaskQueue.length > 0
      ? "Call stack is empty, so the runtime will run the next microtask."
      : state.taskQueue.length > 0
        ? "No microtasks remain, so the runtime will run the next task."
        : state.timers.length > 0
          ? "No runnable work yet; clock advances until a timer is due."
          : "All queues are empty. Execution is complete.";
  const trackEventLoopInteraction = (
    action: string,
    params: Record<string, string | number> = {}
  ) => {
    trackExperimentInteraction(EXPERIMENT_ID, action, params);
  };

  return (
    <section className="mt-6 rounded-xl border border-gray-700 bg-gray-950/70 p-6 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="example"
              className="text-xs font-semibold uppercase tracking-wide text-gray-300"
            >
              Runnable examples
            </label>
            <select
              id="example"
              className="mt-2 w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-gray-100"
              value={selectedExampleId}
              onChange={(event) => {
                trackEventLoopInteraction("change_example", {
                  example_id: event.target.value,
                });
                setSelectedExampleId(event.target.value);
              }}
            >
              {EVENT_LOOP_EXAMPLES.map((example) => (
                <option key={example.id} value={example.id}>
                  {example.name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-body-sm text-gray-300">
              {selectedExample.description}
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-gray-400">
              {selectedExample.learningPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>

          <VisualizerControls
            isPlaying={isPlaying}
            isComplete={state.completed}
            speedMs={speedMs}
            onPlayPause={() => {
              trackEventLoopInteraction(isPlaying ? "pause" : "play");
              setIsPlaying((previous) => !previous);
            }}
            onStep={() => {
              trackEventLoopInteraction("single_step");
              setState((previous) => stepEventLoop(previous));
            }}
            onReset={() => {
              trackEventLoopInteraction("reset");
              setIsPlaying(false);
              setState(createInitialState(selectedExample));
            }}
            onSpeedChange={(value) => {
              trackEventLoopInteraction("change_speed", { value });
              setSpeedMs(value);
            }}
          />

          <div className="rounded-lg border border-violet-700/40 bg-violet-950/20 p-4">
            <p className="text-sm text-violet-100">Tick: {state.tick}</p>
            <p className="mt-1 text-xs text-violet-200">{nextHint}</p>
          </div>
        </div>

        <CallStackPanel frames={state.callStack} />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <QueueColumn
          title="Microtask queue"
          subtitle="Promise callbacks and async continuations."
          items={state.microtaskQueue}
          emptyLabel="No microtasks queued."
        />
        <QueueColumn
          title="Task queue"
          subtitle="Macrotasks like timeout callbacks."
          items={state.taskQueue}
          emptyLabel="No tasks queued."
        />
        <QueueColumn
          title="Timers"
          subtitle="Waiting for their due tick before entering task queue."
          items={state.timers}
          emptyLabel="No pending timers."
        />
      </div>

      <div className="mt-4">
        <TimelinePanel events={state.timeline} />
      </div>
    </section>
  );
}
