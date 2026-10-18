import { DEFAULT_LOAD_FLOW_CASE } from "@/features/load-flow/model/defaults";

import { selectSolverAlgorithm } from "../algorithmSelection";
import { DEFAULT_SOLVE_OPTIONS } from "../types";

describe("selectSolverAlgorithm", () => {
  it("selects newton-raphson for the current engine phase", () => {
    const loadFlowCase = JSON.parse(JSON.stringify(DEFAULT_LOAD_FLOW_CASE));

    const decision = selectSolverAlgorithm(loadFlowCase, DEFAULT_SOLVE_OPTIONS);
    expect(decision.selected).toBe("NEWTON_RAPHSON");
    expect(decision.reason).toMatch(/only implemented algorithm/i);
  });
});
