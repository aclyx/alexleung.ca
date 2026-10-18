import { LoadFlowCase } from "@/features/load-flow/model/types";

import { IEEE_REFERENCE_SCENARIOS } from "./ieeeReferenceScenarios";

export interface LoadFlowReferenceScenario {
  id: string;
  name: string;
  description: string;
  loadFlowCase: LoadFlowCase;
}

const BUILTIN_REFERENCE_SCENARIOS: LoadFlowReferenceScenario[] = [
  {
    id: "two-bus-radial",
    name: "2-Bus Radial",
    description: "Grid supply feeding one load through an inductive line.",
    loadFlowCase: {
      baseMVA: 100,
      buses: [
        {
          id: "bus-1",
          name: "Grid",
          baseKV: 230,
          type: "SLACK",
          voltageMagnitudeSetpoint: 1,
          voltageAngleSetpointDeg: 0,
        },
        {
          id: "bus-2",
          name: "Plant Bus",
          baseKV: 230,
          type: "PQ",
        },
      ],
      branches: [
        {
          id: "line-1",
          fromBusId: "bus-1",
          toBusId: "bus-2",
          r: 0.02,
          x: 0.06,
          bHalf: 0.015,
        },
      ],
      generators: [],
      loads: [
        {
          id: "load-1",
          busId: "bus-2",
          p: 90,
          q: 30,
          status: "ON",
        },
      ],
      shunts: [],
    },
  },
  {
    id: "three-bus-with-pv",
    name: "3-Bus PV + PQ",
    description: "Grid supply and a local generator feeding two loads.",
    loadFlowCase: {
      baseMVA: 100,
      buses: [
        {
          id: "bus-1",
          name: "Slack",
          baseKV: 230,
          type: "SLACK",
          voltageMagnitudeSetpoint: 1.04,
          voltageAngleSetpointDeg: 0,
        },
        {
          id: "bus-2",
          name: "Gen Bus",
          baseKV: 230,
          type: "PV",
          voltageMagnitudeSetpoint: 1.025,
        },
        {
          id: "bus-3",
          name: "Load Bus",
          baseKV: 230,
          type: "PQ",
        },
      ],
      branches: [
        {
          id: "line-1-2",
          fromBusId: "bus-1",
          toBusId: "bus-2",
          r: 0.02,
          x: 0.06,
          bHalf: 0.015,
        },
        {
          id: "line-1-3",
          fromBusId: "bus-1",
          toBusId: "bus-3",
          r: 0.08,
          x: 0.24,
          bHalf: 0.0125,
        },
        {
          id: "line-2-3",
          fromBusId: "bus-2",
          toBusId: "bus-3",
          r: 0.06,
          x: 0.18,
          bHalf: 0.01,
        },
      ],
      generators: [
        {
          id: "gen-2",
          busId: "bus-2",
          pSet: 50,
          vSet: 1.025,
          qMin: -40,
          qMax: 80,
          status: "ON",
        },
      ],
      loads: [
        {
          id: "load-2",
          busId: "bus-2",
          p: 20,
          q: 10,
          status: "ON",
        },
        {
          id: "load-3",
          busId: "bus-3",
          p: 90,
          q: 30,
          status: "ON",
        },
      ],
      shunts: [],
    },
  },
];

export const LOAD_FLOW_REFERENCE_SCENARIOS: LoadFlowReferenceScenario[] = [
  ...BUILTIN_REFERENCE_SCENARIOS,
  ...IEEE_REFERENCE_SCENARIOS,
];

export const getReferenceScenarioById = (
  scenarioId: string
): LoadFlowReferenceScenario | undefined =>
  LOAD_FLOW_REFERENCE_SCENARIOS.find((scenario) => scenario.id === scenarioId);
