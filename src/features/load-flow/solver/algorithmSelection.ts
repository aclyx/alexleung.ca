import { LoadFlowCase } from "@/features/load-flow/model/types";

import { SolveOptions, SolverAlgorithm } from "./types";

interface AlgorithmSelectionDecision {
  selected: SolverAlgorithm;
  reason: string;
}

export const selectSolverAlgorithm = (
  _loadFlowCase: LoadFlowCase,
  options: SolveOptions
): AlgorithmSelectionDecision => ({
  selected: options.algorithm,
  reason:
    "Newton-Raphson is the only implemented algorithm in the current engine phase.",
});
