export type BusType = "SLACK" | "PV" | "PQ";

type ShuntDeviceKind = "REACTOR" | "INDUCTOR" | "CAPACITOR";

export interface Bus {
  id: string;
  name: string;
  baseKV: number;
  type: BusType;
  voltageMagnitudeSetpoint?: number;
  voltageAngleSetpointDeg?: number;
  voltageMagnitudeMin?: number;
  voltageMagnitudeMax?: number;
}

export interface Branch {
  id: string;
  fromBusId: string;
  toBusId: string;
  r: number;
  x: number;
  bHalf?: number;
  tapRatio?: number;
  phaseShiftDeg?: number;
  thermalLimitMVA?: number;
  status?: "IN_SERVICE" | "OUT_OF_SERVICE";
}

export interface Generator {
  id: string;
  busId: string;
  pSet: number;
  vSet: number;
  qMin: number;
  qMax: number;
  status: "ON" | "OFF";
}

export interface Load {
  id: string;
  busId: string;
  p: number;
  q: number;
  status: "ON" | "OFF";
}

/**
 * Sign convention:
 * - Capacitors inject reactive power (positive Q injection at the bus).
 * - Reactors and inductors absorb reactive power (negative Q injection at the bus).
 */
export interface ShuntDevice {
  id: string;
  busId: string;
  kind: ShuntDeviceKind;
  bPu: number;
  status: "ON" | "OFF";
}

export interface LoadFlowCase {
  baseMVA: number;
  buses: Bus[];
  branches: Branch[];
  generators: Generator[];
  loads: Load[];
  shunts: ShuntDevice[];
}
