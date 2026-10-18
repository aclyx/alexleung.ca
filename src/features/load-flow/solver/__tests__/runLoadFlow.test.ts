import { DEFAULT_LOAD_FLOW_CASE } from "@/features/load-flow/model/defaults";
import { Bus } from "@/features/load-flow/model/types";

import { LOAD_FLOW_REFERENCE_SCENARIOS } from "../referenceScenarios";
import { runLoadFlow } from "../runLoadFlow";

describe("runLoadFlow", () => {
  it("returns validation diagnostics for invalid cases", () => {
    const invalidCase = {
      ...DEFAULT_LOAD_FLOW_CASE,
      baseMVA: 0,
    };

    const result = runLoadFlow(invalidCase);

    expect(result.diagnostics.converged).toBe(false);
    expect(result.diagnostics.message).toMatch(/base mva/i);
    expect(result.buses).toBeUndefined();
  });

  it("solves the two-bus radial reference scenario", () => {
    const scenario = LOAD_FLOW_REFERENCE_SCENARIOS.find(
      (item) => item.id === "two-bus-radial"
    );

    expect(scenario).toBeDefined();

    const result = runLoadFlow(scenario!.loadFlowCase);

    expect(result.diagnostics.converged).toBe(true);
    expect(result.buses).toHaveLength(2);

    const plantBus = result.buses?.find((bus) => bus.busId === "bus-2");
    expect(plantBus).toBeDefined();
    expect(plantBus?.voltageMagnitudePu).toBeGreaterThan(0.94);
    expect(plantBus?.voltageMagnitudePu).toBeLessThan(0.98);
    expect(plantBus?.voltageAngleDeg).toBeLessThan(0);
    expect(result.branchFlows).toHaveLength(1);
  });

  it("fails closed when unsupported reactive limit enforcement is requested", () => {
    const scenario = LOAD_FLOW_REFERENCE_SCENARIOS.find(
      (item) => item.id === "three-bus-with-pv"
    );

    expect(scenario).toBeDefined();

    const result = runLoadFlow(scenario!.loadFlowCase, {
      enforceReactiveLimits: true,
    });

    expect(result.diagnostics.converged).toBe(false);
    expect(result.diagnostics.message).toMatch(/not implemented/i);
    expect(result.buses).toBeUndefined();
  });

  it("solves the three-bus PV + PQ reference scenario", () => {
    const scenario = LOAD_FLOW_REFERENCE_SCENARIOS.find(
      (item) => item.id === "three-bus-with-pv"
    );

    expect(scenario).toBeDefined();

    const result = runLoadFlow(scenario!.loadFlowCase);

    expect(result.diagnostics.converged).toBe(true);
    expect(result.buses).toHaveLength(3);

    const pvBus = result.buses?.find((bus) => bus.busId === "bus-2");
    const pqBus = result.buses?.find((bus) => bus.busId === "bus-3");

    expect(pvBus?.voltageMagnitudePu).toBeCloseTo(1.025, 6);
    expect(pqBus?.voltageMagnitudePu).toBeGreaterThan(0.94);
    expect(pqBus?.voltageMagnitudePu).toBeLessThan(0.99);
    expect(pqBus?.voltageAngleDeg).toBeLessThan(0);
    expect(result.diagnostics.maxMismatchPu).not.toBeNull();
    expect(result.diagnostics.iterationMaxMismatchPu.length).toBeGreaterThan(0);
  });

  it("returns consistent bus injections when max iterations are hit", () => {
    const scenario = LOAD_FLOW_REFERENCE_SCENARIOS.find(
      (item) => item.id === "two-bus-radial"
    );

    expect(scenario).toBeDefined();

    const result = runLoadFlow(scenario!.loadFlowCase, {
      maxIterations: 1,
      tolerance: 1e-12,
    });

    expect(result.diagnostics.converged).toBe(false);
    expect(result.buses).toBeDefined();

    for (const bus of result.buses ?? []) {
      expect(Number.isFinite(bus.pInjectionPu)).toBe(true);
      expect(Number.isFinite(bus.qInjectionPu)).toBe(true);
    }
  });

  it("reports island diagnostics for disconnected networks", () => {
    const islandedBus: Bus = {
      id: "bus-2",
      name: "Islanded bus",
      baseKV: 13.8,
      type: "PQ",
    };
    const islandedCase = {
      ...DEFAULT_LOAD_FLOW_CASE,
      buses: [...DEFAULT_LOAD_FLOW_CASE.buses, islandedBus],
    };

    const result = runLoadFlow(islandedCase);

    expect(result.diagnostics.converged).toBe(false);
    expect(result.diagnostics.message).toMatch(/island/i);
  });

  it("loads IEEE benchmark reference scenarios without validation errors", () => {
    const ieeeScenarioIds = [
      "ieee-9-bus",
      "ieee-14-bus",
      "ieee-30-bus",
      "ieee-57-bus",
      "ieee-118-bus",
    ];

    for (const scenarioId of ieeeScenarioIds) {
      const scenario = LOAD_FLOW_REFERENCE_SCENARIOS.find(
        (item) => item.id === scenarioId
      );

      expect(scenario).toBeDefined();

      const result = runLoadFlow(scenario!.loadFlowCase);

      expect(result.diagnostics.message).not.toMatch(
        /required|does not exist/i
      );
      expect(result.buses).toHaveLength(scenario!.loadFlowCase.buses.length);
      expect(result.diagnostics.iterationsCompleted).toBeGreaterThan(0);
    }
  });

  it("accounts for transformer tap and phase shift in branch modeling", () => {
    const scenario = LOAD_FLOW_REFERENCE_SCENARIOS.find(
      (item) => item.id === "two-bus-radial"
    );

    expect(scenario).toBeDefined();

    const baselineResult = runLoadFlow(scenario!.loadFlowCase);
    const transformedResult = runLoadFlow({
      ...scenario!.loadFlowCase,
      branches: scenario!.loadFlowCase.branches.map((branch) => ({
        ...branch,
        tapRatio: 1.08,
        phaseShiftDeg: 12,
      })),
    });

    expect(baselineResult.diagnostics.converged).toBe(true);
    expect(transformedResult.diagnostics.converged).toBe(true);

    const baselineBus = baselineResult.buses?.find(
      (bus) => bus.busId === "bus-2"
    );
    const transformedBus = transformedResult.buses?.find(
      (bus) => bus.busId === "bus-2"
    );

    expect(baselineBus).toBeDefined();
    expect(transformedBus).toBeDefined();
    expect(
      Math.abs(transformedBus!.voltageAngleDeg - baselineBus!.voltageAngleDeg)
    ).toBeGreaterThan(5);
    expect(
      Math.abs(
        transformedBus!.voltageMagnitudePu - baselineBus!.voltageMagnitudePu
      )
    ).toBeGreaterThan(0.01);
  });
});
