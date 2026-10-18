import { LoadFlowCase } from "@/features/load-flow/model/types";
import { validateLoadFlowCase } from "@/features/load-flow/model/validation";

import { selectSolverAlgorithm } from "./algorithmSelection";
import { solveWithNewtonRaphson } from "./newtonRaphsonSolver";
import { DEFAULT_SOLVE_OPTIONS, LoadFlowResult, SolveOptions } from "./types";

export const runLoadFlow = (
  loadFlowCase: LoadFlowCase,
  options?: Partial<SolveOptions>
): LoadFlowResult => {
  const resolvedOptions: SolveOptions = {
    ...DEFAULT_SOLVE_OPTIONS,
    ...options,
  };

  const validation = validateLoadFlowCase(loadFlowCase);
  if (validation.errors.length > 0) {
    return {
      diagnostics: {
        converged: false,
        algorithm: resolvedOptions.algorithm,
        initialization: resolvedOptions.initialization,
        message: validation.errors.join(" "),
        iterationsCompleted: 0,
        maxMismatchPu: null,
        iterationMaxMismatchPu: [],
      },
    };
  }

  if (resolvedOptions.enforceReactiveLimits) {
    return {
      diagnostics: {
        converged: false,
        algorithm: resolvedOptions.algorithm,
        initialization: resolvedOptions.initialization,
        message:
          "Reactive generator limit enforcement is not implemented for this solver yet.",
        iterationsCompleted: 0,
        maxMismatchPu: null,
        iterationMaxMismatchPu: [],
      },
    };
  }

  const algorithmDecision = selectSolverAlgorithm(
    loadFlowCase,
    resolvedOptions
  );

  if (algorithmDecision.selected === "NEWTON_RAPHSON") {
    return solveWithNewtonRaphson(loadFlowCase, resolvedOptions);
  }

  return {
    diagnostics: {
      converged: false,
      algorithm: algorithmDecision.selected,
      initialization: resolvedOptions.initialization,
      message: "No matching solver implementation found.",
      iterationsCompleted: 0,
      maxMismatchPu: null,
      iterationMaxMismatchPu: [],
    },
  };
};
