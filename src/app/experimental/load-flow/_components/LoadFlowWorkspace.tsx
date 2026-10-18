"use client";

import { useEffect, useMemo, useState } from "react";

import { actionClassNames, fieldClassNames } from "@/components/controlStyles";
import { FlowMode, layoutDiagram } from "@/features/load-flow/diagram";
import { toLoadFlowCase } from "@/features/load-flow/graph/toLoadFlowCase";
import { LoadFlowCase } from "@/features/load-flow/model/types";
import {
  getReferenceScenarioById,
  LOAD_FLOW_REFERENCE_SCENARIOS,
} from "@/features/load-flow/solver/referenceScenarios";
import { runLoadFlow } from "@/features/load-flow/solver/runLoadFlow";
import {
  addBranch,
  addBus,
  createInitialLoadFlowEditorState,
  replaceEditorStateFromLoadFlowCase,
  selectElement,
  updateBranch,
  updateBus,
} from "@/features/load-flow/state/loadFlowStore";
import { trackExperimentInteraction } from "@/lib/analytics";

import { LoadFlowResults } from "./LoadFlowResults";
import { SingleLineDiagram } from "./SingleLineDiagram";

const DEFAULT_SCENARIO = "three-bus-with-pv";
const FLOW_MODES: FlowMode[] = ["both", "p", "q"];
const LOAD_COMPONENTS: Array<"p" | "q"> = ["p", "q"];
const BRANCH_FIELDS: Array<{
  key: "r" | "x" | "bHalf" | "tapRatio" | "phaseShiftDeg";
  label: string;
  fallback: number;
}> = [
  { key: "r", label: "R (pu)", fallback: 0 },
  { key: "x", label: "X (pu)", fallback: 0 },
  { key: "bHalf", label: "B/2 (pu)", fallback: 0 },
  { key: "tapRatio", label: "Tap ratio", fallback: 1 },
  { key: "phaseShiftDeg", label: "Phase shift (°)", fallback: 0 },
];
const buttonClass = actionClassNames({ variant: "secondary", size: "sm" });

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => {
    setDraft(String(value));
  }, [value]);
  return (
    <label className="grid gap-1 text-sm text-muted">
      {label}
      <input
        className={fieldClassNames()}
        type="number"
        step="any"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          const parsed = Number(draft);
          if (draft.trim() && Number.isFinite(parsed)) onChange(parsed);
          else setDraft(String(value));
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
      />
    </label>
  );
}

function initialState(id: string) {
  const scenario = getReferenceScenarioById(id);
  return layoutDiagram(
    scenario
      ? replaceEditorStateFromLoadFlowCase(scenario.loadFlowCase)
      : createInitialLoadFlowEditorState()
  );
}

export function LoadFlowWorkspace() {
  const [editor, setEditor] = useState(() => initialState(DEFAULT_SCENARIO));
  const [scenarioId, setScenarioId] = useState(DEFAULT_SCENARIO);
  const [loadPercent, setLoadPercent] = useState(100);
  const [mode, setMode] = useState<FlowMode>("both");
  const [animate, setAnimate] = useState(true);
  const [showAmounts, setShowAmounts] = useState(true);
  const [diagramRevision, setDiagramRevision] = useState(0);
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const scenario = getReferenceScenarioById(scenarioId);
  // Selection and diagram coordinates do not belong to the electrical model.
  const modelKey = JSON.stringify(toLoadFlowCase(editor));
  const model = useMemo(() => {
    const network: LoadFlowCase = JSON.parse(modelKey);
    return {
      ...network,
      loads: network.loads.map((load) => ({
        ...load,
        p: (load.p * loadPercent) / 100,
        q: (load.q * loadPercent) / 100,
      })),
    };
  }, [modelKey, loadPercent]);
  const result = useMemo(() => runLoadFlow(model), [model]);
  const solved = result.diagnostics.converged;
  const busSolutions = new Map(
    (solved ? (result.buses ?? []) : []).map((bus) => [bus.busId, bus])
  );
  const branchFlows = new Map(
    (solved ? (result.branchFlows ?? []) : []).map((flow) => [
      flow.branchId,
      flow,
    ])
  );
  const selectedBus =
    editor.selectedElementType === "BUS"
      ? editor.busesById[editor.selectedElementId ?? ""]
      : undefined;
  const selectedBranch =
    editor.selectedElementType === "BRANCH"
      ? editor.branchesById[editor.selectedElementId ?? ""]
      : undefined;
  const selectedSolution = selectedBus
    ? busSolutions.get(selectedBus.id)
    : undefined;
  const selectedFlow = selectedBranch
    ? branchFlows.get(selectedBranch.id)
    : undefined;
  const loads = model.loads.filter((load) => load.status === "ON");
  const totalP = loads.reduce((sum, load) => sum + load.p, 0);
  const totalQ = loads.reduce((sum, load) => sum + load.q, 0);
  const lossP = [...branchFlows.values()].reduce(
    (sum, flow) => sum + flow.pLossMW,
    0
  );
  const voltages = [...busSolutions.values()].map(
    (bus) => bus.voltageMagnitudePu
  );
  const track = (
    action: string,
    params: Record<string, string | number> = {}
  ) =>
    trackExperimentInteraction("load_flow_workspace", action, {
      scenario_id: scenarioId,
      ...params,
    });

  function reset(id: string) {
    setDiagramRevision((value) => value + 1);
    setEditor((previous) => {
      const next = initialState(id);
      if (
        id === scenarioId &&
        previous.selectedElementId &&
        (previous.selectedElementType === "BUS"
          ? next.busesById[previous.selectedElementId]
          : next.branchesById[previous.selectedElementId])
      )
        return selectElement(
          next,
          previous.selectedElementType,
          previous.selectedElementId
        );
      return next;
    });
    setScenarioId(id);
    setLoadPercent(100);
    setFromId("");
    setToId("");
  }

  return (
    <section aria-label="Interactive load-flow tool" className="space-y-6">
      <div className="grid items-end gap-5 md:grid-cols-[1fr_1fr_auto]">
        <label className="grid gap-2 text-sm font-semibold">
          Network
          <select
            className={fieldClassNames({ kind: "select" })}
            value={scenarioId}
            onChange={(event) => {
              reset(event.target.value);
              track("load_reference_case", { scenario_id: event.target.value });
            }}
          >
            {LOAD_FLOW_REFERENCE_SCENARIOS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
            <option value="custom">Empty network</option>
          </select>
        </label>
        <label
          className="grid gap-2 text-sm font-semibold"
          htmlFor="load-scale"
        >
          Load · {loadPercent}%
          <input
            id="load-scale"
            className="min-h-11 w-full accent-accent-link"
            type="range"
            min="0"
            max="200"
            step="5"
            value={loadPercent}
            onChange={(event) => setLoadPercent(Number(event.target.value))}
            onPointerUp={() =>
              track("change_load", { load_percent: loadPercent })
            }
            onKeyUp={() => track("change_load", { load_percent: loadPercent })}
          />
        </label>
        <button
          className={buttonClass}
          onClick={() => {
            reset(scenarioId);
            track("reset_reference_case");
          }}
        >
          Reset network
        </button>
      </div>
      <p className="text-sm text-muted">
        {scenario?.description ??
          "Add buses and lines in the network editor below."}{" "}
        The load slider scales P and Q together; generator P setpoints stay
        fixed.
      </p>
      <div
        className="grid grid-cols-2 gap-4 border-y border-line py-4 md:grid-cols-4"
        aria-label="Network summary"
      >
        <div>
          <p className="text-xs text-muted">Total demand</p>
          <p className="mt-1 font-mono text-sm">
            {totalP.toFixed(1)} MW / {totalQ.toFixed(1)} MVAr
          </p>
        </div>
        <div>
          <p className="text-xs text-muted">Voltage range</p>
          <p className="mt-1 font-mono text-sm">
            {solved && voltages.length
              ? `${Math.min(...voltages).toFixed(3)}–${Math.max(...voltages).toFixed(3)} pu`
              : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted">Active power loss</p>
          <p className="mt-1 font-mono text-sm">
            {solved ? `${lossP.toFixed(2)} MW` : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted">Solution</p>
          <p role="status" className="mt-1 text-sm">
            {solved
              ? `Converged · ${result.diagnostics.iterationsCompleted} iterations`
              : "No converged solution"}
          </p>
        </div>
      </div>
      {!solved && (
        <p role="alert" className="border-l-2 border-accent-link pl-4 text-sm">
          {result.diagnostics.message} Flow and voltage overlays are hidden
          until the network converges.
        </p>
      )}
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-heading-sm">Single-line diagram</h2>
          <div className="flex flex-wrap gap-2">
            <div role="group" aria-label="Power overlay" className="flex gap-1">
              {FLOW_MODES.map((item) => (
                <button
                  key={item}
                  aria-pressed={mode === item}
                  className={actionClassNames({
                    variant: mode === item ? "primary" : "secondary",
                    size: "sm",
                  })}
                  onClick={() => {
                    setMode(item);
                    track("change_overlay", { overlay: item });
                  }}
                >
                  {item === "both"
                    ? "P + Q"
                    : item === "p"
                      ? "P · MW"
                      : "Q · MVAr"}
                </button>
              ))}
            </div>
            <button
              className={buttonClass}
              aria-pressed={showAmounts}
              onClick={() => setShowAmounts(!showAmounts)}
            >
              {showAmounts ? "Hide amounts" : "Show amounts"}
            </button>
            <button
              className={buttonClass}
              aria-pressed={animate}
              onClick={() => {
                setAnimate(!animate);
                track("toggle_motion", { enabled: Number(!animate) });
              }}
            >
              {animate ? "Pause motion" : "Animate flow"}
            </button>
          </div>
        </div>
        <SingleLineDiagram
          key={`${scenarioId}:${diagramRevision}`}
          buses={editor.busOrder.map((id) => editor.busesById[id])}
          branches={editor.branchOrder.map((id) => editor.branchesById[id])}
          generators={model.generators}
          loads={model.loads}
          baseMVA={model.baseMVA}
          selectedElementId={editor.selectedElementId}
          selectedElementType={editor.selectedElementType}
          onBusSelect={(id) =>
            setEditor((state) => selectElement(state, "BUS", id))
          }
          onBusMove={(id, x, y) =>
            setEditor((state) => updateBus(state, id, { x, y }))
          }
          onBranchSelect={(id) =>
            setEditor((state) => selectElement(state, "BRANCH", id))
          }
          busSolutionsById={busSolutions}
          branchFlowsById={branchFlows}
          mode={mode}
          animate={animate && solved}
          showAmounts={showAmounts}
        />
      </div>
      <section
        aria-label="Selected element"
        className="border-t border-line pt-5"
      >
        <label className="grid max-w-md gap-2 text-sm font-semibold">
          Inspect
          <select
            className={fieldClassNames({ kind: "select" })}
            value={
              editor.selectedElementType && editor.selectedElementId
                ? `${editor.selectedElementType}:${editor.selectedElementId}`
                : ""
            }
            onChange={(event) => {
              const [type, ...id] = event.target.value.split(":");
              if (type === "BUS" || type === "BRANCH")
                setEditor((state) => selectElement(state, type, id.join(":")));
            }}
          >
            <option value="" disabled>
              Select a bus or line
            </option>
            <optgroup label="Buses">
              {editor.busOrder.map((id) => (
                <option key={id} value={`BUS:${id}`}>
                  {editor.busesById[id].name} · {editor.busesById[id].type}
                </option>
              ))}
            </optgroup>
            <optgroup label="Lines">
              {editor.branchOrder.map((id) => (
                <option key={id} value={`BRANCH:${id}`}>
                  {id} ·{" "}
                  {editor.busesById[editor.branchesById[id].fromBusId].name} →{" "}
                  {editor.busesById[editor.branchesById[id].toBusId].name}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
        {selectedSolution && (
          <p className="mt-3 text-sm">
            {selectedSolution.voltageMagnitudePu.toFixed(4)} pu ∠{" "}
            {selectedSolution.voltageAngleDeg.toFixed(3)}° · Net injection{" "}
            {(selectedSolution.pInjectionPu * model.baseMVA).toFixed(2)} MW /{" "}
            {(selectedSolution.qInjectionPu * model.baseMVA).toFixed(2)} MVAr
          </p>
        )}
        {selectedBranch && (
          <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
            <p>
              <span className="block text-xs text-muted">
                From end · {editor.busesById[selectedBranch.fromBusId].name}
              </span>
              {selectedFlow
                ? `${selectedFlow.pFromToMW.toFixed(2)} MW / ${selectedFlow.qFromToMVar.toFixed(2)} MVAr`
                : "—"}
            </p>
            <p>
              <span className="block text-xs text-muted">
                To end · {editor.busesById[selectedBranch.toBusId].name}
              </span>
              {selectedFlow
                ? `${selectedFlow.pToFromMW.toFixed(2)} MW / ${selectedFlow.qToFromMVar.toFixed(2)} MVAr`
                : "—"}
            </p>
            <p>
              <span className="block text-xs text-muted">
                Net absorbed · positive into line
              </span>
              {selectedFlow
                ? `${selectedFlow.pLossMW.toFixed(2)} MW / ${selectedFlow.qLossMVar.toFixed(2)} MVAr`
                : "—"}
            </p>
          </div>
        )}
        <details
          key={`${editor.selectedElementType}:${editor.selectedElementId}`}
          className="mt-3"
        >
          <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold">
            Edit selected element
          </summary>
          <p className="mb-3 text-xs text-muted">
            Numeric edits apply on Enter or when you leave the field. Load
            values below are before the global load multiplier.
          </p>
          {selectedBus && (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <label className="grid gap-1 text-sm text-muted">
                Name
                <input
                  className={fieldClassNames()}
                  value={selectedBus.name}
                  onChange={(event) =>
                    setEditor((state) =>
                      updateBus(state, selectedBus.id, {
                        name: event.target.value,
                      })
                    )
                  }
                />
              </label>
              <label className="grid gap-1 text-sm text-muted">
                Bus type
                <select
                  className={fieldClassNames({ kind: "select" })}
                  value={selectedBus.type}
                  onChange={(event) => {
                    const type = event.target.value;
                    if (type === "SLACK" || type === "PV" || type === "PQ")
                      setEditor((state) =>
                        updateBus(state, selectedBus.id, { type })
                      );
                  }}
                >
                  {["SLACK", "PV", "PQ"].map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>
              <NumberField
                label="Base kV"
                value={selectedBus.baseKV}
                onChange={(value) =>
                  setEditor((state) =>
                    updateBus(state, selectedBus.id, { baseKV: value })
                  )
                }
              />
              {selectedBus.type !== "PQ" && (
                <NumberField
                  label="Voltage setpoint (pu)"
                  value={selectedBus.voltageMagnitudeSetpoint ?? 1}
                  onChange={(value) =>
                    setEditor((state) =>
                      updateBus(state, selectedBus.id, {
                        voltageMagnitudeSetpoint: value,
                      })
                    )
                  }
                />
              )}
              {selectedBus.type === "SLACK" && (
                <NumberField
                  label="Reference angle (°)"
                  value={selectedBus.voltageAngleSetpointDeg ?? 0}
                  onChange={(value) =>
                    setEditor((state) =>
                      updateBus(state, selectedBus.id, {
                        voltageAngleSetpointDeg: value,
                      })
                    )
                  }
                />
              )}
              {LOAD_COMPONENTS.map((component) => (
                <NumberField
                  key={component}
                  label={`Load ${component === "p" ? "P (MW)" : "Q (MVAr)"}`}
                  value={editor.loads
                    .filter(
                      (load) =>
                        load.busId === selectedBus.id && load.status === "ON"
                    )
                    .reduce((sum, load) => sum + load[component], 0)}
                  onChange={(value) =>
                    setEditor((state) => {
                      const active = state.loads.filter(
                        (load) =>
                          load.busId === selectedBus.id && load.status === "ON"
                      );
                      const other = component === "p" ? "q" : "p";
                      return {
                        ...state,
                        loads: [
                          ...state.loads.filter(
                            (load) =>
                              load.busId !== selectedBus.id ||
                              load.status !== "ON"
                          ),
                          {
                            id: `edited-load-${selectedBus.id}`,
                            busId: selectedBus.id,
                            status: "ON",
                            p: 0,
                            q: 0,
                            [other]: active.reduce(
                              (sum, load) => sum + load[other],
                              0
                            ),
                            [component]: value,
                          },
                        ],
                      };
                    })
                  }
                />
              ))}
              {selectedBus.type === "PV" && (
                <NumberField
                  label="Generation P (MW)"
                  value={editor.generators
                    .filter(
                      (gen) =>
                        gen.busId === selectedBus.id && gen.status === "ON"
                    )
                    .reduce((sum, gen) => sum + gen.pSet, 0)}
                  onChange={(value) =>
                    setEditor((state) => ({
                      ...state,
                      generators: [
                        ...state.generators.filter(
                          (gen) =>
                            gen.busId !== selectedBus.id || gen.status !== "ON"
                        ),
                        {
                          id: `edited-gen-${selectedBus.id}`,
                          busId: selectedBus.id,
                          status: "ON",
                          pSet: value,
                          vSet: selectedBus.voltageMagnitudeSetpoint ?? 1,
                          qMin: -9999,
                          qMax: 9999,
                        },
                      ],
                    }))
                  }
                />
              )}
            </div>
          )}
          {selectedBranch && (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {BRANCH_FIELDS.map((field) => (
                <NumberField
                  key={field.key}
                  label={field.label}
                  value={selectedBranch[field.key] ?? field.fallback}
                  onChange={(value) =>
                    setEditor((state) =>
                      updateBranch(state, selectedBranch.id, {
                        [field.key]: value,
                      })
                    )
                  }
                />
              ))}
              <label className="grid gap-1 text-sm text-muted">
                Line status
                <select
                  className={fieldClassNames({ kind: "select" })}
                  value={selectedBranch.status ?? "IN_SERVICE"}
                  onChange={(event) => {
                    const status = event.target.value;
                    if (status === "IN_SERVICE" || status === "OUT_OF_SERVICE")
                      setEditor((state) =>
                        updateBranch(state, selectedBranch.id, { status })
                      );
                  }}
                >
                  <option value="IN_SERVICE">In service</option>
                  <option value="OUT_OF_SERVICE">Out of service</option>
                </select>
              </label>
            </div>
          )}
        </details>
      </section>
      <LoadFlowResults result={result} baseMVA={model.baseMVA} />
      <details className="border-t border-line py-5">
        <summary className="min-h-11 cursor-pointer text-heading-sm">
          Network editor & model
        </summary>
        <div className="my-4 flex flex-wrap gap-3">
          <button
            className={buttonClass}
            onClick={() => setEditor((state) => addBus(state))}
          >
            Add bus
          </button>
          <button
            className={buttonClass}
            onClick={() => {
              setEditor(layoutDiagram);
              setDiagramRevision((value) => value + 1);
            }}
          >
            Arrange buses
          </button>
        </div>
        <div className="grid items-end gap-3 sm:grid-cols-3">
          {[
            { label: "From bus", value: fromId, set: setFromId },
            { label: "To bus", value: toId, set: setToId },
          ].map((field) => (
            <label key={field.label} className="grid gap-1 text-sm text-muted">
              {field.label}
              <select
                className={fieldClassNames({ kind: "select" })}
                value={field.value}
                onChange={(event) => field.set(event.target.value)}
              >
                <option value="">Select bus</option>
                {editor.busOrder.map((id) => (
                  <option key={id} value={id}>
                    {editor.busesById[id].name}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <button
            className={buttonClass}
            disabled={!fromId || !toId || fromId === toId}
            onClick={() => setEditor((state) => addBranch(state, fromId, toId))}
          >
            Connect buses
          </button>
        </div>
        <p className="mt-5 text-sm leading-relaxed text-muted">
          Balanced, steady-state AC power flow using Newton–Raphson on a{" "}
          {model.baseMVA} MVA base. Loads are constant P/Q. Lines use a π model
          with charging at both ends; transformers support taps and phase
          shifts. Slack fixes voltage and angle; PV fixes active generation and
          voltage. Generator reactive-power limits and thermal limits are not
          enforced. Convergence is not a claim of safe operation.
        </p>
        <details className="mt-4">
          <summary className="min-h-11 cursor-pointer py-2 text-sm">
            Case JSON
          </summary>
          <pre className="max-h-96 overflow-auto bg-white p-3 text-xs">
            {JSON.stringify(model, null, 2)}
          </pre>
        </details>
      </details>
    </section>
  );
}
