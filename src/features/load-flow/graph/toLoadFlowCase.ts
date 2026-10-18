import { Branch, Bus, LoadFlowCase } from "@/features/load-flow/model/types";
import { LoadFlowEditorState } from "@/features/load-flow/state/loadFlowStore";

export const toLoadFlowCase = (state: LoadFlowEditorState): LoadFlowCase => {
  const buses: Bus[] = state.busOrder.map((busId) => {
    const bus = state.busesById[busId];
    return {
      id: bus.id,
      name: bus.name,
      baseKV: bus.baseKV,
      type: bus.type,
      voltageMagnitudeSetpoint: bus.voltageMagnitudeSetpoint,
      voltageAngleSetpointDeg: bus.voltageAngleSetpointDeg,
      voltageMagnitudeMin: bus.voltageMagnitudeMin,
      voltageMagnitudeMax: bus.voltageMagnitudeMax,
    };
  });

  const branches: Branch[] = state.branchOrder.map((branchId) => {
    const branch = state.branchesById[branchId];
    return {
      id: branch.id,
      fromBusId: branch.fromBusId,
      toBusId: branch.toBusId,
      r: branch.r,
      x: branch.x,
      bHalf: branch.bHalf,
      tapRatio: branch.tapRatio,
      phaseShiftDeg: branch.phaseShiftDeg,
      thermalLimitMVA: branch.thermalLimitMVA,
      status: branch.status,
    };
  });

  return {
    baseMVA: state.baseMVA,
    buses,
    branches,
    generators: state.generators.map((generator) => ({ ...generator })),
    loads: state.loads.map((load) => ({ ...load })),
    shunts: state.shunts.map((shunt) => ({ ...shunt })),
  };
};
