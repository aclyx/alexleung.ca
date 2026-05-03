"use client";

import { useMemo, useState } from "react";

import { SingleLineDiagram } from "@/app/experimental/load-flow/_components/SingleLineDiagram";
import { toLoadFlowCase } from "@/features/load-flow/graph/toLoadFlowCase";
import { Branch, BusType } from "@/features/load-flow/model/types";
import {
  getReferenceScenarioById,
  LOAD_FLOW_REFERENCE_SCENARIOS,
} from "@/features/load-flow/solver/referenceScenarios";
import { runLoadFlow } from "@/features/load-flow/solver/runLoadFlow";
import {
  addBranch,
  addBus,
  autoLayoutBuses,
  createInitialLoadFlowEditorState,
  replaceEditorStateFromLoadFlowCase,
  selectElement,
  updateBranch,
  updateBus,
} from "@/features/load-flow/state/loadFlowStore";
import { trackExperimentInteraction } from "@/lib/analytics";

const BUS_TYPE_OPTIONS: BusType[] = ["SLACK", "PV", "PQ"];
const EXPERIMENT_ID = "load_flow_workspace";
type BranchStatus = NonNullable<Branch["status"]>;
const BRANCH_STATUS_OPTIONS: readonly BranchStatus[] = [
  "IN_SERVICE",
  "OUT_OF_SERVICE",
];

const parseFiniteNumber = (value: string): number | null => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const isBusType = (value: string): value is BusType =>
  BUS_TYPE_OPTIONS.some((type) => type === value);

const isBranchStatus = (value: string): value is BranchStatus =>
  BRANCH_STATUS_OPTIONS.some((status) => status === value);

export function LoadFlowWorkspace() {
  const defaultReferenceScenario = getReferenceScenarioById("ieee-14-bus");
  const [editorState, setEditorState] = useState(() =>
    defaultReferenceScenario
      ? replaceEditorStateFromLoadFlowCase(
          defaultReferenceScenario.loadFlowCase
        )
      : createInitialLoadFlowEditorState()
  );
  const [selectedReferenceScenarioId, setSelectedReferenceScenarioId] =
    useState<string | null>(defaultReferenceScenario?.id ?? null);

  const selectedBus =
    editorState.selectedElementType === "BUS" && editorState.selectedElementId
      ? editorState.busesById[editorState.selectedElementId]
      : null;
  const selectedBranch =
    editorState.selectedElementType === "BRANCH" &&
    editorState.selectedElementId
      ? editorState.branchesById[editorState.selectedElementId]
      : null;

  const serializedCase = useMemo(
    () => toLoadFlowCase(editorState),
    [editorState]
  );
  const selectedReferenceScenario = selectedReferenceScenarioId
    ? getReferenceScenarioById(selectedReferenceScenarioId)
    : undefined;

  const solveResult = useMemo(
    () => runLoadFlow(serializedCase),
    [serializedCase]
  );
  const busSolutionsById = useMemo(
    () =>
      new Map(
        (solveResult.buses ?? []).map((busSolution) => [
          busSolution.busId,
          busSolution,
        ])
      ),
    [solveResult.buses]
  );
  const branchFlowsById = useMemo(
    () =>
      new Map(
        (solveResult.branchFlows ?? []).map((branchFlow) => [
          branchFlow.branchId,
          branchFlow,
        ])
      ),
    [solveResult.branchFlows]
  );

  const trackLoadFlowInteraction = (
    action: string,
    params: Record<string, string | number> = {}
  ) => {
    trackExperimentInteraction(EXPERIMENT_ID, action, params);
  };

  const resetActiveReferenceCase = () => {
    if (!selectedReferenceScenario) {
      return;
    }

    trackLoadFlowInteraction("reset_reference_case", {
      scenario_id: selectedReferenceScenario.id,
    });
    setEditorState((previousState) => {
      const resetState = replaceEditorStateFromLoadFlowCase(
        selectedReferenceScenario.loadFlowCase
      );

      const selectedElementStillExists =
        previousState.selectedElementType === "BUS"
          ? previousState.selectedElementId !== null &&
            Boolean(resetState.busesById[previousState.selectedElementId])
          : previousState.selectedElementType === "BRANCH"
            ? previousState.selectedElementId !== null &&
              Boolean(resetState.branchesById[previousState.selectedElementId])
            : false;

      if (!selectedElementStillExists) {
        return resetState;
      }

      return selectElement(
        resetState,
        previousState.selectedElementType,
        previousState.selectedElementId
      );
    });
  };

  return (
    <section className="rounded-xl border border-gray-700 bg-gray-900/60 p-6 shadow-sm">
      <h2 className="text-heading-sm text-white">Workspace</h2>
      <p className="text-body mt-2 text-gray-300">
        Build a one-line model, run an AC load flow solve, and inspect voltage
        and branch flow outputs.
      </p>

      <div className="mt-4 rounded-lg border border-emerald-700/70 bg-emerald-950/30 p-4">
        <h3 className="font-semibold text-emerald-200">Reference scenarios</h3>
        <p className="mt-1 text-sm text-emerald-100/90">
          Solve against standard benchmark cases, or switch back to the current
          editor graph model.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-md border border-emerald-500 px-3 py-2 text-sm text-emerald-100 hover:bg-emerald-900/50"
            onClick={() => {
              trackLoadFlowInteraction("reset_editor_model");
              setSelectedReferenceScenarioId(null);
              setEditorState(createInitialLoadFlowEditorState());
            }}
          >
            Reset editor model
          </button>
          {LOAD_FLOW_REFERENCE_SCENARIOS.map((scenario) => (
            <button
              key={scenario.id}
              type="button"
              className="rounded-md border border-emerald-500 px-3 py-2 text-sm text-emerald-100 hover:bg-emerald-900/50"
              onClick={() => {
                trackLoadFlowInteraction("load_reference_case", {
                  scenario_id: scenario.id,
                });
                setSelectedReferenceScenarioId(scenario.id);
                setEditorState(
                  replaceEditorStateFromLoadFlowCase(scenario.loadFlowCase)
                );
              }}
            >
              {scenario.name}
            </button>
          ))}
          {selectedReferenceScenario ? (
            <button
              type="button"
              className="rounded-md border border-emerald-400 bg-emerald-900/30 px-3 py-2 text-sm text-emerald-50 hover:bg-emerald-900/50"
              onClick={resetActiveReferenceCase}
            >
              Reset active reference case
            </button>
          ) : null}
        </div>
        {selectedReferenceScenario ? (
          <p className="mt-2 text-xs text-emerald-100/80">
            Active solve case: {selectedReferenceScenario.name} —{" "}
            {selectedReferenceScenario.description}
          </p>
        ) : (
          <p className="mt-2 text-xs text-emerald-100/80">
            Active solve case: editor graph serialization.
          </p>
        )}
      </div>

      <div className="mt-6 rounded-lg border border-gray-700 p-4">
        <h3 className="font-semibold text-white">Single-line diagram</h3>
        <p className="mt-1 text-sm text-gray-300">
          Interactive topology view of buses and branches.
        </p>
        <SingleLineDiagram
          buses={editorState.busOrder.map(
            (busId) => editorState.busesById[busId]
          )}
          branches={editorState.branchOrder.map(
            (branchId) => editorState.branchesById[branchId]
          )}
          selectedElementId={editorState.selectedElementId}
          selectedElementType={editorState.selectedElementType}
          onBusSelect={(busId) =>
            setEditorState((prev) => selectElement(prev, "BUS", busId))
          }
          onBusMove={(busId, x, y) =>
            setEditorState((prev) => updateBus(prev, busId, { x, y }))
          }
          onBranchSelect={(branchId) =>
            setEditorState((prev) => selectElement(prev, "BRANCH", branchId))
          }
          busSolutionsById={busSolutionsById}
          branchFlowsById={branchFlowsById}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-700 p-4">
          <h3 className="font-semibold text-white">Palette</h3>
          <p className="mt-1 text-sm text-gray-300">
            Add buses, then connect them with line elements.
          </p>
          <button
            type="button"
            className="mt-3 rounded-md border border-gray-500 px-3 py-2 text-sm text-white hover:bg-gray-800"
            onClick={() => {
              trackLoadFlowInteraction("add_bus");
              setEditorState((prev) => addBus(prev));
            }}
          >
            Add bus
          </button>
          <button
            type="button"
            className="ml-2 mt-3 rounded-md border border-gray-500 px-3 py-2 text-sm text-white hover:bg-gray-800"
            onClick={() => {
              trackLoadFlowInteraction("auto_layout");
              setEditorState((prev) => autoLayoutBuses(prev));
            }}
          >
            Auto-layout SLD
          </button>

          <div className="mt-3 space-y-2 text-sm text-gray-200">
            {editorState.busOrder.length < 2 ? (
              <p>Add at least two buses to create a line.</p>
            ) : (
              <button
                type="button"
                className="rounded-md border border-gray-500 px-3 py-2 text-sm text-white hover:bg-gray-800"
                onClick={() => {
                  const [fromBusId, toBusId] = editorState.busOrder;
                  trackLoadFlowInteraction("add_branch");
                  setEditorState((prev) => addBranch(prev, fromBusId, toBusId));
                }}
              >
                Connect first two buses
              </button>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-gray-700 p-4">
          <h3 className="font-semibold text-white">Topology selection</h3>
          <div className="mt-3 space-y-2 text-sm text-gray-200">
            {editorState.busOrder.map((busId) => {
              const bus = editorState.busesById[busId];
              const isSelected =
                editorState.selectedElementType === "BUS" &&
                editorState.selectedElementId === bus.id;
              return (
                <button
                  key={bus.id}
                  type="button"
                  className={`block w-full rounded-md border px-3 py-2 text-left transition ${
                    isSelected
                      ? "border-emerald-300 bg-emerald-900/40 text-emerald-100"
                      : "border-gray-600 hover:bg-gray-800"
                  }`}
                  onClick={() => {
                    trackLoadFlowInteraction("select_bus", { bus_id: bus.id });
                    setEditorState((prev) =>
                      selectElement(prev, "BUS", bus.id)
                    );
                  }}
                >
                  {bus.name} • {bus.type} • {bus.baseKV} kV
                </button>
              );
            })}

            {editorState.branchOrder.map((branchId) => {
              const branch = editorState.branchesById[branchId];
              const isSelected =
                editorState.selectedElementType === "BRANCH" &&
                editorState.selectedElementId === branch.id;
              return (
                <button
                  key={branch.id}
                  type="button"
                  className={`block w-full rounded-md border px-3 py-2 text-left transition ${
                    isSelected
                      ? "border-emerald-300 bg-emerald-900/40 text-emerald-100"
                      : "border-blue-800 text-blue-200 hover:bg-gray-800"
                  }`}
                  onClick={() => {
                    trackLoadFlowInteraction("select_branch", {
                      branch_id: branch.id,
                    });
                    setEditorState((prev) =>
                      selectElement(prev, "BRANCH", branch.id)
                    );
                  }}
                >
                  {branch.id}: {branch.fromBusId} → {branch.toBusId}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-gray-700 p-4">
          <h3 className="font-semibold text-white">Properties</h3>
          {selectedBus ? (
            <div className="mt-3 space-y-2 text-sm text-gray-200">
              <label className="block">
                <span>Name</span>
                <input
                  value={selectedBus.name}
                  className="mt-1 w-full rounded border border-gray-600 bg-gray-950 px-2 py-1"
                  onChange={(event) =>
                    setEditorState((prev) =>
                      updateBus(prev, selectedBus.id, {
                        name: event.target.value,
                      })
                    )
                  }
                />
              </label>
              <label className="block">
                <span>Base kV</span>
                <input
                  type="number"
                  value={selectedBus.baseKV}
                  className="mt-1 w-full rounded border border-gray-600 bg-gray-950 px-2 py-1"
                  onChange={(event) => {
                    const parsedBaseKV = parseFiniteNumber(event.target.value);
                    if (parsedBaseKV === null) {
                      return;
                    }

                    setEditorState((prev) =>
                      updateBus(prev, selectedBus.id, {
                        baseKV: parsedBaseKV,
                      })
                    );
                  }}
                />
              </label>

              <label className="block">
                <span>Voltage setpoint |V| (pu)</span>
                <input
                  type="number"
                  value={selectedBus.voltageMagnitudeSetpoint ?? ""}
                  className="mt-1 w-full rounded border border-gray-600 bg-gray-950 px-2 py-1"
                  onChange={(event) => {
                    if (event.target.value.trim() === "") {
                      setEditorState((prev) =>
                        updateBus(prev, selectedBus.id, {
                          voltageMagnitudeSetpoint: undefined,
                        })
                      );
                      return;
                    }

                    const parsedSetpoint = parseFiniteNumber(
                      event.target.value
                    );
                    if (parsedSetpoint === null) {
                      return;
                    }

                    setEditorState((prev) =>
                      updateBus(prev, selectedBus.id, {
                        voltageMagnitudeSetpoint: parsedSetpoint,
                      })
                    );
                  }}
                />
              </label>
              <label className="block">
                <span>Voltage angle setpoint θ (deg)</span>
                <input
                  type="number"
                  value={selectedBus.voltageAngleSetpointDeg ?? ""}
                  className="mt-1 w-full rounded border border-gray-600 bg-gray-950 px-2 py-1"
                  onChange={(event) => {
                    if (event.target.value.trim() === "") {
                      setEditorState((prev) =>
                        updateBus(prev, selectedBus.id, {
                          voltageAngleSetpointDeg: undefined,
                        })
                      );
                      return;
                    }

                    const parsedAngleSetpoint = parseFiniteNumber(
                      event.target.value
                    );
                    if (parsedAngleSetpoint === null) {
                      return;
                    }

                    setEditorState((prev) =>
                      updateBus(prev, selectedBus.id, {
                        voltageAngleSetpointDeg: parsedAngleSetpoint,
                      })
                    );
                  }}
                />
              </label>
              <label className="block">
                <span>Voltage min |V| (pu)</span>
                <input
                  type="number"
                  value={selectedBus.voltageMagnitudeMin ?? ""}
                  className="mt-1 w-full rounded border border-gray-600 bg-gray-950 px-2 py-1"
                  onChange={(event) => {
                    if (event.target.value.trim() === "") {
                      setEditorState((prev) =>
                        updateBus(prev, selectedBus.id, {
                          voltageMagnitudeMin: undefined,
                        })
                      );
                      return;
                    }

                    const parsedVoltageMin = parseFiniteNumber(
                      event.target.value
                    );
                    if (parsedVoltageMin === null) {
                      return;
                    }

                    setEditorState((prev) =>
                      updateBus(prev, selectedBus.id, {
                        voltageMagnitudeMin: parsedVoltageMin,
                      })
                    );
                  }}
                />
              </label>
              <label className="block">
                <span>Voltage max |V| (pu)</span>
                <input
                  type="number"
                  value={selectedBus.voltageMagnitudeMax ?? ""}
                  className="mt-1 w-full rounded border border-gray-600 bg-gray-950 px-2 py-1"
                  onChange={(event) => {
                    if (event.target.value.trim() === "") {
                      setEditorState((prev) =>
                        updateBus(prev, selectedBus.id, {
                          voltageMagnitudeMax: undefined,
                        })
                      );
                      return;
                    }

                    const parsedVoltageMax = parseFiniteNumber(
                      event.target.value
                    );
                    if (parsedVoltageMax === null) {
                      return;
                    }

                    setEditorState((prev) =>
                      updateBus(prev, selectedBus.id, {
                        voltageMagnitudeMax: parsedVoltageMax,
                      })
                    );
                  }}
                />
              </label>
              <label className="block">
                <span>Type</span>
                <select
                  value={selectedBus.type}
                  className="mt-1 w-full rounded border border-gray-600 bg-gray-950 px-2 py-1"
                  onChange={(event) => {
                    const nextType = event.target.value;
                    if (!isBusType(nextType)) {
                      return;
                    }

                    setEditorState((prev) =>
                      updateBus(prev, selectedBus.id, {
                        type: nextType,
                      })
                    );
                  }}
                >
                  {BUS_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}

          {selectedBranch ? (
            <div className="mt-3 space-y-2 text-sm text-gray-200">
              <label className="block">
                <span>R (pu)</span>
                <input
                  type="number"
                  value={selectedBranch.r}
                  className="mt-1 w-full rounded border border-gray-600 bg-gray-950 px-2 py-1"
                  onChange={(event) => {
                    const parsedResistance = parseFiniteNumber(
                      event.target.value
                    );
                    if (parsedResistance === null) {
                      return;
                    }

                    setEditorState((prev) =>
                      updateBranch(prev, selectedBranch.id, {
                        r: parsedResistance,
                      })
                    );
                  }}
                />
              </label>
              <label className="block">
                <span>X (pu)</span>
                <input
                  type="number"
                  value={selectedBranch.x}
                  className="mt-1 w-full rounded border border-gray-600 bg-gray-950 px-2 py-1"
                  onChange={(event) => {
                    const parsedReactance = parseFiniteNumber(
                      event.target.value
                    );
                    if (parsedReactance === null) {
                      return;
                    }

                    setEditorState((prev) =>
                      updateBranch(prev, selectedBranch.id, {
                        x: parsedReactance,
                      })
                    );
                  }}
                />
              </label>
              <label className="block">
                <span>B/2 (pu)</span>
                <input
                  type="number"
                  value={selectedBranch.bHalf}
                  className="mt-1 w-full rounded border border-gray-600 bg-gray-950 px-2 py-1"
                  onChange={(event) => {
                    const parsedBHalf = parseFiniteNumber(event.target.value);
                    if (parsedBHalf === null) {
                      return;
                    }

                    setEditorState((prev) =>
                      updateBranch(prev, selectedBranch.id, {
                        bHalf: parsedBHalf,
                      })
                    );
                  }}
                />
              </label>
              <label className="block">
                <span>Thermal limit (MVA)</span>
                <input
                  type="number"
                  value={selectedBranch.thermalLimitMVA ?? ""}
                  className="mt-1 w-full rounded border border-gray-600 bg-gray-950 px-2 py-1"
                  onChange={(event) => {
                    if (event.target.value.trim() === "") {
                      setEditorState((prev) =>
                        updateBranch(prev, selectedBranch.id, {
                          thermalLimitMVA: undefined,
                        })
                      );
                      return;
                    }

                    const parsedThermalLimit = parseFiniteNumber(
                      event.target.value
                    );
                    if (parsedThermalLimit === null) {
                      return;
                    }

                    setEditorState((prev) =>
                      updateBranch(prev, selectedBranch.id, {
                        thermalLimitMVA: parsedThermalLimit,
                      })
                    );
                  }}
                />
              </label>
              <label className="block">
                <span>Status</span>
                <select
                  value={selectedBranch.status ?? "IN_SERVICE"}
                  className="mt-1 w-full rounded border border-gray-600 bg-gray-950 px-2 py-1"
                  onChange={(event) => {
                    const nextStatus = event.target.value;
                    if (!isBranchStatus(nextStatus)) {
                      return;
                    }

                    setEditorState((prev) =>
                      updateBranch(prev, selectedBranch.id, {
                        status: nextStatus,
                      })
                    );
                  }}
                >
                  {BRANCH_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}

          {!selectedBus && !selectedBranch ? (
            <p className="mt-3 text-sm text-gray-300">
              Select a bus or line to edit properties.
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-gray-700 p-4">
        <h3 className="font-semibold text-white">Solve results</h3>
        <p className="mt-2 text-sm text-gray-300">
          {solveResult.diagnostics.message}
        </p>
        {solveResult.buses ? (
          <div className="mt-3 overflow-auto">
            <table className="min-w-full text-left text-xs text-gray-200">
              <thead>
                <tr>
                  <th className="pr-3">Bus</th>
                  <th className="pr-3">|V| (pu)</th>
                  <th className="pr-3">θ (deg)</th>
                  <th className="pr-3">P inj (pu)</th>
                  <th>Q inj (pu)</th>
                </tr>
              </thead>
              <tbody>
                {solveResult.buses.map((bus) => (
                  <tr key={bus.busId}>
                    <td className="pr-3">{bus.busId}</td>
                    <td className="pr-3">
                      {bus.voltageMagnitudePu.toFixed(4)}
                    </td>
                    <td className="pr-3">{bus.voltageAngleDeg.toFixed(3)}</td>
                    <td className="pr-3">{bus.pInjectionPu.toFixed(4)}</td>
                    <td>{bus.qInjectionPu.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <div className="mt-6 rounded-lg border border-gray-700 p-4">
        <h3 className="font-semibold text-white">Serialized case preview</h3>
        <pre className="mt-2 overflow-auto text-xs text-gray-300">
          {JSON.stringify(serializedCase, null, 2)}
        </pre>
      </div>
    </section>
  );
}
