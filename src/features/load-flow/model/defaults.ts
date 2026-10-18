import { LoadFlowCase } from "@/features/load-flow/model/types";

export const DEFAULT_LOAD_FLOW_CASE: LoadFlowCase = {
  baseMVA: 100,
  buses: [
    {
      id: "bus-1",
      name: "Bus 1",
      baseKV: 230,
      type: "SLACK",
      voltageMagnitudeSetpoint: 1,
      voltageAngleSetpointDeg: 0,
    },
  ],
  branches: [],
  generators: [],
  loads: [],
  shunts: [],
};
