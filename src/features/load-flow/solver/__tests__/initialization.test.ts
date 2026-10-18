import { DEFAULT_LOAD_FLOW_CASE } from "@/features/load-flow/model/defaults";

import { buildInitialization } from "../initialization";

describe("buildInitialization", () => {
  it("returns deterministic flat start voltage state", () => {
    const loadFlowCase = JSON.parse(JSON.stringify(DEFAULT_LOAD_FLOW_CASE));

    const initialization = buildInitialization(loadFlowCase, "FLAT_START");

    expect(initialization.source).toBe("FLAT_START");
    expect(initialization.voltageMagnitudeByBusId["bus-1"]).toBe(1);
    expect(initialization.voltageAngleDegByBusId["bus-1"]).toBe(0);
  });
});
