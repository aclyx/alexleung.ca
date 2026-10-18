import { LoadFlowCase } from "@/features/load-flow/model/types";

interface LoadFlowValidationResult {
  errors: string[];
}

const hasInvalidBranchImpedance = (r: number, x: number): boolean =>
  Math.abs(r) < Number.EPSILON && Math.abs(x) < Number.EPSILON;

const getDuplicateIds = (ids: string[]): string[] => [
  ...new Set(ids.filter((id, index) => ids.indexOf(id) !== index)),
];

const isFiniteNumber = (value: number): boolean => Number.isFinite(value);
const isNonNegativeFiniteNumber = (value: number): boolean =>
  isFiniteNumber(value) && value >= 0;
const isPositiveFiniteNumber = (value: number): boolean =>
  isFiniteNumber(value) && value > 0;

export const validateLoadFlowCase = (
  loadFlowCase: LoadFlowCase
): LoadFlowValidationResult => {
  const errors: string[] = [];

  if (!isFiniteNumber(loadFlowCase.baseMVA) || loadFlowCase.baseMVA <= 0) {
    errors.push("Base MVA must be a finite number greater than zero.");
  }

  const slackBuses = loadFlowCase.buses.filter((bus) => bus.type === "SLACK");

  if (slackBuses.length !== 1) {
    errors.push("Exactly one slack bus is required.");
  }

  const busIds = new Set(loadFlowCase.buses.map((bus) => bus.id));
  const duplicateBusIds = getDuplicateIds(
    loadFlowCase.buses.map((bus) => bus.id)
  );

  for (const duplicateBusId of duplicateBusIds) {
    errors.push(`Duplicate bus id detected: ${duplicateBusId}.`);
  }

  for (const bus of loadFlowCase.buses) {
    if (!isNonNegativeFiniteNumber(bus.baseKV)) {
      errors.push(
        `Bus ${bus.id} has invalid base kV (must be a finite number greater than or equal to zero).`
      );
    }

    if (
      bus.voltageMagnitudeSetpoint !== undefined &&
      !isPositiveFiniteNumber(bus.voltageMagnitudeSetpoint)
    ) {
      errors.push(
        `Bus ${bus.id} has invalid voltage magnitude setpoint (must be a finite number greater than zero).`
      );
    }

    if (
      bus.voltageAngleSetpointDeg !== undefined &&
      !isFiniteNumber(bus.voltageAngleSetpointDeg)
    ) {
      errors.push(
        `Bus ${bus.id} has invalid voltage angle setpoint (must be a finite number in degrees).`
      );
    }

    if (
      bus.voltageMagnitudeMin !== undefined &&
      !isPositiveFiniteNumber(bus.voltageMagnitudeMin)
    ) {
      errors.push(
        `Bus ${bus.id} has invalid minimum voltage magnitude (must be a finite number greater than zero).`
      );
    }

    if (
      bus.voltageMagnitudeMax !== undefined &&
      !isPositiveFiniteNumber(bus.voltageMagnitudeMax)
    ) {
      errors.push(
        `Bus ${bus.id} has invalid maximum voltage magnitude (must be a finite number greater than zero).`
      );
    }

    if (
      bus.voltageMagnitudeMin !== undefined &&
      bus.voltageMagnitudeMax !== undefined &&
      bus.voltageMagnitudeMin > bus.voltageMagnitudeMax
    ) {
      errors.push(
        `Bus ${bus.id} has invalid voltage limits (minimum cannot exceed maximum).`
      );
    }
  }

  for (const branch of loadFlowCase.branches) {
    if (!busIds.has(branch.fromBusId) || !busIds.has(branch.toBusId)) {
      errors.push(
        `Branch ${branch.id} references a bus that does not exist in the case.`
      );
    }

    if (!isFiniteNumber(branch.r) || !isFiniteNumber(branch.x)) {
      errors.push(
        `Branch ${branch.id} has invalid impedance (r and x must be finite numbers).`
      );
    }

    if (hasInvalidBranchImpedance(branch.r, branch.x)) {
      errors.push(
        `Branch ${branch.id} has invalid impedance (r and x cannot both be zero).`
      );
    }

    if (branch.bHalf !== undefined && !isFiniteNumber(branch.bHalf)) {
      errors.push(
        `Branch ${branch.id} has invalid shunt susceptance (must be a finite number).`
      );
    }

    if (
      branch.tapRatio !== undefined &&
      (!isFiniteNumber(branch.tapRatio) || branch.tapRatio <= 0)
    ) {
      errors.push(
        `Branch ${branch.id} has invalid tap ratio (must be a finite number greater than zero).`
      );
    }

    if (
      branch.phaseShiftDeg !== undefined &&
      !isFiniteNumber(branch.phaseShiftDeg)
    ) {
      errors.push(
        `Branch ${branch.id} has invalid phase shift (must be a finite number in degrees).`
      );
    }

    if (
      branch.thermalLimitMVA !== undefined &&
      !isPositiveFiniteNumber(branch.thermalLimitMVA)
    ) {
      errors.push(
        `Branch ${branch.id} has invalid thermal limit (must be a finite number greater than zero).`
      );
    }
  }

  for (const generator of loadFlowCase.generators) {
    if (!busIds.has(generator.busId)) {
      errors.push(
        `Generator ${generator.id} references a bus that does not exist in the case.`
      );
    }

    if (!isFiniteNumber(generator.pSet)) {
      errors.push(
        `Generator ${generator.id} has invalid active power setpoint (must be a finite number).`
      );
    }

    if (!isPositiveFiniteNumber(generator.vSet)) {
      errors.push(
        `Generator ${generator.id} has invalid voltage setpoint (must be a finite number greater than zero).`
      );
    }

    if (!isFiniteNumber(generator.qMin) || !isFiniteNumber(generator.qMax)) {
      errors.push(
        `Generator ${generator.id} has invalid reactive limits (qMin and qMax must be finite numbers).`
      );
    } else if (generator.qMin > generator.qMax) {
      errors.push(
        `Generator ${generator.id} has invalid reactive limits (qMin cannot exceed qMax).`
      );
    }
  }

  const generatorBusIds = new Set(
    loadFlowCase.generators
      .filter((generator) => generator.status === "ON")
      .map((generator) => generator.busId)
  );

  for (const bus of loadFlowCase.buses) {
    if (bus.type === "PV" && !generatorBusIds.has(bus.id)) {
      errors.push(
        `PV bus ${bus.id} must be associated with an online generator.`
      );
    }
  }

  for (const load of loadFlowCase.loads) {
    if (!busIds.has(load.busId)) {
      errors.push(
        `Load ${load.id} references a bus that does not exist in the case.`
      );
    }

    if (!isFiniteNumber(load.p) || !isFiniteNumber(load.q)) {
      errors.push(
        `Load ${load.id} has invalid power values (p and q must be finite numbers).`
      );
    }
  }

  for (const shunt of loadFlowCase.shunts) {
    if (!busIds.has(shunt.busId)) {
      errors.push(
        `Shunt ${shunt.id} references a bus that does not exist in the case.`
      );
    }

    if (!isFiniteNumber(shunt.bPu)) {
      errors.push(
        `Shunt ${shunt.id} has invalid susceptance (must be a finite number).`
      );
    }
  }

  return { errors };
};
