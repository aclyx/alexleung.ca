/**
 * Keep the public surface area intentionally narrow until the first
 * numerical kernel is production-ready.
 */
export type SolverAlgorithm = "NEWTON_RAPHSON";
export type InitializationMode = "FLAT_START";

export interface SolveOptions {
  tolerance: number;
  maxIterations: number;
  damping: number;
  enforceReactiveLimits: boolean;
  algorithm: SolverAlgorithm;
  initialization: InitializationMode;
}

export interface SolverInitialization {
  voltageMagnitudeByBusId: Record<string, number>;
  voltageAngleDegByBusId: Record<string, number>;
  source: InitializationMode;
}

export interface BusSolution {
  busId: string;
  voltageMagnitudePu: number;
  voltageAngleDeg: number;
  pInjectionPu: number;
  qInjectionPu: number;
}

export interface BranchFlowSolution {
  branchId: string;
  fromBusId: string;
  toBusId: string;
  pFromToMW: number;
  qFromToMVar: number;
  pToFromMW: number;
  qToFromMVar: number;
  pLossMW: number;
  qLossMVar: number;
}

interface LoadFlowDiagnostics {
  converged: boolean;
  algorithm: SolverAlgorithm;
  initialization: InitializationMode;
  message: string;
  iterationsCompleted: number;
  maxMismatchPu: number | null;
  iterationMaxMismatchPu: number[];
}

export interface LoadFlowResult {
  diagnostics: LoadFlowDiagnostics;
  buses?: BusSolution[];
  branchFlows?: BranchFlowSolution[];
}

export const DEFAULT_SOLVE_OPTIONS: SolveOptions = {
  tolerance: 1e-6,
  maxIterations: 30,
  damping: 1,
  enforceReactiveLimits: false,
  algorithm: "NEWTON_RAPHSON",
  initialization: "FLAT_START",
};
