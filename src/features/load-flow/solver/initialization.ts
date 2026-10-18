import { LoadFlowCase } from "@/features/load-flow/model/types";

import { InitializationMode, SolverInitialization } from "./types";

const getVoltageMagnitudeStart = (): number => 1;
const getVoltageAngleStart = (): number => 0;

export const buildInitialization = (
  loadFlowCase: LoadFlowCase,
  mode: InitializationMode
): SolverInitialization => {
  const voltageMagnitudeByBusId: Record<string, number> = {};
  const voltageAngleDegByBusId: Record<string, number> = {};

  for (const bus of loadFlowCase.buses) {
    voltageMagnitudeByBusId[bus.id] = getVoltageMagnitudeStart();
    voltageAngleDegByBusId[bus.id] = getVoltageAngleStart();
  }

  return {
    voltageMagnitudeByBusId,
    voltageAngleDegByBusId,
    source: mode,
  };
};
