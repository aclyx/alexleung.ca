import { LoadFlowCase } from "../../model/types";
import { LOAD_FLOW_REFERENCE_SCENARIOS } from "../referenceScenarios";
import { runLoadFlow } from "../runLoadFlow";

test("matches the analytic lossless two-bus solution", () => {
  // For |V1| = |V2| = 1, X = 0.1, δ2 = -0.1 rad:
  // Pload = sin(0.1)/X and Qload = (cos(0.1)-1)/X, on a 100 MVA base.
  const network: LoadFlowCase = {
    baseMVA: 100,
    buses: [
      {
        id: "1",
        name: "Reference",
        baseKV: 230,
        type: "SLACK",
        voltageMagnitudeSetpoint: 1,
        voltageAngleSetpointDeg: 0,
      },
      { id: "2", name: "Load", baseKV: 230, type: "PQ" },
    ],
    branches: [{ id: "line", fromBusId: "1", toBusId: "2", r: 0, x: 0.1 }],
    generators: [],
    shunts: [],
    loads: [
      {
        id: "load",
        busId: "2",
        p: 1000 * Math.sin(0.1),
        q: 1000 * (Math.cos(0.1) - 1),
        status: "ON",
      },
    ],
  };
  const result = runLoadFlow(network, { tolerance: 1e-10 });
  expect(result.diagnostics.converged).toBe(true);
  expect(result.buses![1].voltageMagnitudePu).toBeCloseTo(1, 8);
  expect(result.buses![1].voltageAngleDeg).toBeCloseTo(
    (-0.1 * 180) / Math.PI,
    7
  );
  expect(result.branchFlows![0].pLossMW).toBeCloseTo(0, 8);
  expect(result.branchFlows![0].qFromToMVar).toBeGreaterThan(0);
  expect(result.branchFlows![0].qToFromMVar).toBeGreaterThan(0);
});

test("line charging can send reactive power out of both terminals", () => {
  const network: LoadFlowCase = {
    baseMVA: 100,
    buses: [
      {
        id: "1",
        name: "Reference",
        baseKV: 230,
        type: "SLACK",
        voltageMagnitudeSetpoint: 1,
      },
      {
        id: "2",
        name: "Generator",
        baseKV: 230,
        type: "PV",
        voltageMagnitudeSetpoint: 1,
      },
    ],
    branches: [
      {
        id: "line",
        fromBusId: "1",
        toBusId: "2",
        r: 0.01,
        x: 0.1,
        bHalf: 0.02,
      },
    ],
    loads: [],
    shunts: [],
    generators: [
      {
        id: "gen",
        busId: "2",
        pSet: 0,
        vSet: 1,
        qMin: -10,
        qMax: 10,
        status: "ON",
      },
    ],
  };
  const result = runLoadFlow(network);
  expect(result.diagnostics.converged).toBe(true);
  expect(result.branchFlows![0].qFromToMVar).toBeCloseTo(-2, 8);
  expect(result.branchFlows![0].qToFromMVar).toBeCloseTo(-2, 8);
});

test.each(LOAD_FLOW_REFERENCE_SCENARIOS)(
  "$name conserves real power at every bus",
  (scenario) => {
    const result = runLoadFlow(scenario.loadFlowCase);
    expect(result.diagnostics.converged).toBe(true);
    for (const bus of result.buses!) {
      const terminals = result.branchFlows!.reduce(
        (sum, line) =>
          sum +
          (line.fromBusId === bus.busId ? line.pFromToMW : 0) +
          (line.toBusId === bus.busId ? line.pToFromMW : 0),
        0
      );
      expect(terminals).toBeCloseTo(
        bus.pInjectionPu * scenario.loadFlowCase.baseMVA,
        5
      );
    }
  }
);
