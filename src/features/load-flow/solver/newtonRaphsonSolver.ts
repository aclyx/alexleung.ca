import { Bus, BusType, LoadFlowCase } from "@/features/load-flow/model/types";

import {
  addComplex,
  Complex,
  complex,
  conjugateComplex,
  divideComplex,
  multiplyComplex,
  polarToComplex,
} from "./complex";
import { buildInitialization } from "./initialization";
import {
  BranchFlowSolution,
  BusSolution,
  LoadFlowResult,
  SolveOptions,
} from "./types";

interface SolveState {
  voltageMagnitudes: number[];
  voltageAnglesRad: number[];
}

interface SpecifiedInjections {
  pByBusIndex: number[];
  qByBusIndex: number[];
}

interface BusPartitions {
  slack: number[];
  pv: number[];
  pq: number[];
  nonSlack: number[];
}

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;
const toDegrees = (radians: number): number => (radians * 180) / Math.PI;

const createMatrix = (size: number): number[][] =>
  Array.from({ length: size }, () => Array(size).fill(0));

interface BranchAdmittanceTerms {
  yFromFrom: Complex;
  yFromTo: Complex;
  yToFrom: Complex;
  yToTo: Complex;
}

const solveLinearSystem = (a: number[][], b: number[]): number[] => {
  const size = a.length;
  const augmented = a.map((row, rowIndex) => [...row, b[rowIndex]]);

  for (let pivot = 0; pivot < size; pivot += 1) {
    let maxRow = pivot;
    let maxValue = Math.abs(augmented[pivot][pivot]);

    for (let row = pivot + 1; row < size; row += 1) {
      const candidate = Math.abs(augmented[row][pivot]);
      if (candidate > maxValue) {
        maxValue = candidate;
        maxRow = row;
      }
    }

    if (maxValue < 1e-12) {
      throw new Error("Jacobian is singular or ill-conditioned.");
    }

    if (maxRow !== pivot) {
      const temp = augmented[pivot];
      augmented[pivot] = augmented[maxRow];
      augmented[maxRow] = temp;
    }

    for (let row = pivot + 1; row < size; row += 1) {
      const factor = augmented[row][pivot] / augmented[pivot][pivot];
      for (let col = pivot; col <= size; col += 1) {
        augmented[row][col] -= factor * augmented[pivot][col];
      }
    }
  }

  const solution = Array(size).fill(0);
  for (let row = size - 1; row >= 0; row -= 1) {
    let total = augmented[row][size];
    for (let col = row + 1; col < size; col += 1) {
      total -= augmented[row][col] * solution[col];
    }
    solution[row] = total / augmented[row][row];
  }

  return solution;
};

const getBusPartitions = (buses: Bus[]): BusPartitions => {
  const slack: number[] = [];
  const pv: number[] = [];
  const pq: number[] = [];

  buses.forEach((bus, index) => {
    if (bus.type === "SLACK") {
      slack.push(index);
      return;
    }

    if (bus.type === "PV") {
      pv.push(index);
      return;
    }

    pq.push(index);
  });

  return {
    slack,
    pv,
    pq,
    nonSlack: [...pv, ...pq],
  };
};

const getBranchAdmittanceTerms = (
  r: number,
  x: number,
  bHalf = 0,
  tapRatio = 1,
  phaseShiftDeg = 0
): BranchAdmittanceTerms => {
  const seriesAdmittance = divideComplex(complex(1, 0), complex(r, x));
  const shuntAdmittance = complex(0, bHalf);
  const tap = polarToComplex(tapRatio, toRadians(phaseShiftDeg));
  const tapConjugate = conjugateComplex(tap);
  const tapMagnitudeSquared = tapRatio * tapRatio;

  return {
    yFromFrom: divideComplex(
      addComplex(seriesAdmittance, shuntAdmittance),
      complex(tapMagnitudeSquared, 0)
    ),
    yFromTo: divideComplex(
      multiplyComplex(complex(-1, 0), seriesAdmittance),
      tapConjugate
    ),
    yToFrom: divideComplex(
      multiplyComplex(complex(-1, 0), seriesAdmittance),
      tap
    ),
    yToTo: addComplex(seriesAdmittance, shuntAdmittance),
  };
};

const buildYBus = (
  loadFlowCase: LoadFlowCase,
  busIndexById: Record<string, number>
): Complex[][] => {
  const size = loadFlowCase.buses.length;
  const yBus = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => complex(0, 0))
  );

  for (const branch of loadFlowCase.branches) {
    if (branch.status === "OUT_OF_SERVICE") {
      continue;
    }

    const fromIndex = busIndexById[branch.fromBusId];
    const toIndex = busIndexById[branch.toBusId];

    const branchTerms = getBranchAdmittanceTerms(
      branch.r,
      branch.x,
      branch.bHalf ?? 0,
      branch.tapRatio ?? 1,
      branch.phaseShiftDeg ?? 0
    );

    yBus[fromIndex][fromIndex] = addComplex(
      yBus[fromIndex][fromIndex],
      branchTerms.yFromFrom
    );
    yBus[toIndex][toIndex] = addComplex(
      yBus[toIndex][toIndex],
      branchTerms.yToTo
    );

    yBus[fromIndex][toIndex] = addComplex(
      yBus[fromIndex][toIndex],
      branchTerms.yFromTo
    );
    yBus[toIndex][fromIndex] = addComplex(
      yBus[toIndex][fromIndex],
      branchTerms.yToFrom
    );
  }

  for (const shunt of loadFlowCase.shunts) {
    if (shunt.status !== "ON") {
      continue;
    }

    const busIndex = busIndexById[shunt.busId];
    const signedSusceptance =
      shunt.kind === "CAPACITOR" ? shunt.bPu : -Math.abs(shunt.bPu);
    yBus[busIndex][busIndex] = addComplex(
      yBus[busIndex][busIndex],
      complex(0, signedSusceptance)
    );
  }

  return yBus;
};

const computeSpecifiedInjections = (
  loadFlowCase: LoadFlowCase,
  busIndexById: Record<string, number>
): SpecifiedInjections => {
  const size = loadFlowCase.buses.length;
  const pByBusIndex = Array(size).fill(0);
  const qByBusIndex = Array(size).fill(0);

  for (const generator of loadFlowCase.generators) {
    if (generator.status !== "ON") {
      continue;
    }

    const index = busIndexById[generator.busId];
    pByBusIndex[index] += generator.pSet / loadFlowCase.baseMVA;
  }

  for (const load of loadFlowCase.loads) {
    if (load.status !== "ON") {
      continue;
    }

    const index = busIndexById[load.busId];
    pByBusIndex[index] -= load.p / loadFlowCase.baseMVA;
    qByBusIndex[index] -= load.q / loadFlowCase.baseMVA;
  }

  return { pByBusIndex, qByBusIndex };
};

const calculatePowerInjections = (
  yBus: Complex[][],
  state: SolveState
): { pCalculated: number[]; qCalculated: number[] } => {
  const size = yBus.length;
  const pCalculated = Array(size).fill(0);
  const qCalculated = Array(size).fill(0);

  for (let i = 0; i < size; i += 1) {
    for (let j = 0; j < size; j += 1) {
      const delta = state.voltageAnglesRad[i] - state.voltageAnglesRad[j];
      const g = yBus[i][j].re;
      const b = yBus[i][j].im;
      const vmProduct = state.voltageMagnitudes[i] * state.voltageMagnitudes[j];

      pCalculated[i] += vmProduct * (g * Math.cos(delta) + b * Math.sin(delta));
      qCalculated[i] += vmProduct * (g * Math.sin(delta) - b * Math.cos(delta));
    }
  }

  return { pCalculated, qCalculated };
};

const buildJacobian = (
  yBus: Complex[][],
  state: SolveState,
  partitions: BusPartitions,
  pCalculated: number[],
  qCalculated: number[]
): number[][] => {
  const pSize = partitions.nonSlack.length;
  const qSize = partitions.pq.length;
  const totalSize = pSize + qSize;
  const jacobian = createMatrix(totalSize);

  partitions.nonSlack.forEach((i, row) => {
    partitions.nonSlack.forEach((j, col) => {
      if (i === j) {
        jacobian[row][col] =
          -qCalculated[i] - yBus[i][i].im * state.voltageMagnitudes[i] ** 2;
        return;
      }

      const delta = state.voltageAnglesRad[i] - state.voltageAnglesRad[j];
      const g = yBus[i][j].re;
      const b = yBus[i][j].im;
      jacobian[row][col] =
        state.voltageMagnitudes[i] *
        state.voltageMagnitudes[j] *
        (g * Math.sin(delta) - b * Math.cos(delta));
    });
  });

  partitions.nonSlack.forEach((i, row) => {
    partitions.pq.forEach((j, col) => {
      const column = pSize + col;
      if (i === j) {
        jacobian[row][column] =
          pCalculated[i] / state.voltageMagnitudes[i] +
          yBus[i][i].re * state.voltageMagnitudes[i];
        return;
      }

      const delta = state.voltageAnglesRad[i] - state.voltageAnglesRad[j];
      const g = yBus[i][j].re;
      const b = yBus[i][j].im;
      jacobian[row][column] =
        state.voltageMagnitudes[i] *
        (g * Math.cos(delta) + b * Math.sin(delta));
    });
  });

  partitions.pq.forEach((i, row) => {
    const matrixRow = pSize + row;

    partitions.nonSlack.forEach((j, col) => {
      if (i === j) {
        jacobian[matrixRow][col] =
          pCalculated[i] - yBus[i][i].re * state.voltageMagnitudes[i] ** 2;
        return;
      }

      const delta = state.voltageAnglesRad[i] - state.voltageAnglesRad[j];
      const g = yBus[i][j].re;
      const b = yBus[i][j].im;
      jacobian[matrixRow][col] =
        -state.voltageMagnitudes[i] *
        state.voltageMagnitudes[j] *
        (g * Math.cos(delta) + b * Math.sin(delta));
    });

    partitions.pq.forEach((j, col) => {
      const matrixCol = pSize + col;
      if (i === j) {
        jacobian[matrixRow][matrixCol] =
          qCalculated[i] / state.voltageMagnitudes[i] -
          yBus[i][i].im * state.voltageMagnitudes[i];
        return;
      }

      const delta = state.voltageAnglesRad[i] - state.voltageAnglesRad[j];
      const g = yBus[i][j].re;
      const b = yBus[i][j].im;
      jacobian[matrixRow][matrixCol] =
        state.voltageMagnitudes[i] *
        (g * Math.sin(delta) - b * Math.cos(delta));
    });
  });

  return jacobian;
};

const buildMismatchVector = (
  partitions: BusPartitions,
  specified: SpecifiedInjections,
  pCalculated: number[],
  qCalculated: number[]
): number[] => {
  const mismatch: number[] = [];

  for (const busIndex of partitions.nonSlack) {
    mismatch.push(specified.pByBusIndex[busIndex] - pCalculated[busIndex]);
  }

  for (const busIndex of partitions.pq) {
    mismatch.push(specified.qByBusIndex[busIndex] - qCalculated[busIndex]);
  }

  return mismatch;
};

const getMaximumAbsolute = (values: number[]): number =>
  values.reduce((maxValue, value) => Math.max(maxValue, Math.abs(value)), 0);

const buildSolvedBusStates = (
  loadFlowCase: LoadFlowCase,
  state: SolveState,
  pCalculated: number[],
  qCalculated: number[]
): BusSolution[] =>
  loadFlowCase.buses.map((bus, index) => ({
    busId: bus.id,
    voltageMagnitudePu: state.voltageMagnitudes[index],
    voltageAngleDeg: toDegrees(state.voltageAnglesRad[index]),
    pInjectionPu: pCalculated[index],
    qInjectionPu: qCalculated[index],
  }));

const buildBranchFlows = (
  loadFlowCase: LoadFlowCase,
  busIndexById: Record<string, number>,
  state: SolveState
): BranchFlowSolution[] => {
  const voltageByBusIndex = state.voltageMagnitudes.map((magnitude, index) =>
    polarToComplex(magnitude, state.voltageAnglesRad[index])
  );

  return loadFlowCase.branches
    .filter((branch) => branch.status !== "OUT_OF_SERVICE")
    .map((branch) => {
      const fromIndex = busIndexById[branch.fromBusId];
      const toIndex = busIndexById[branch.toBusId];

      const fromVoltage = voltageByBusIndex[fromIndex];
      const toVoltage = voltageByBusIndex[toIndex];
      const branchTerms = getBranchAdmittanceTerms(
        branch.r,
        branch.x,
        branch.bHalf ?? 0,
        branch.tapRatio ?? 1,
        branch.phaseShiftDeg ?? 0
      );

      const currentFromTo = addComplex(
        multiplyComplex(branchTerms.yFromFrom, fromVoltage),
        multiplyComplex(branchTerms.yFromTo, toVoltage)
      );
      const currentToFrom = addComplex(
        multiplyComplex(branchTerms.yToFrom, fromVoltage),
        multiplyComplex(branchTerms.yToTo, toVoltage)
      );

      const sFromTo = multiplyComplex(
        fromVoltage,
        conjugateComplex(currentFromTo)
      );
      const sToFrom = multiplyComplex(
        toVoltage,
        conjugateComplex(currentToFrom)
      );

      return {
        branchId: branch.id,
        fromBusId: branch.fromBusId,
        toBusId: branch.toBusId,
        pFromToMW: sFromTo.re * loadFlowCase.baseMVA,
        qFromToMVar: sFromTo.im * loadFlowCase.baseMVA,
        pToFromMW: sToFrom.re * loadFlowCase.baseMVA,
        qToFromMVar: sToFrom.im * loadFlowCase.baseMVA,
        pLossMW: (sFromTo.re + sToFrom.re) * loadFlowCase.baseMVA,
        qLossMVar: (sFromTo.im + sToFrom.im) * loadFlowCase.baseMVA,
      };
    });
};

const getInitialState = (
  loadFlowCase: LoadFlowCase,
  options: SolveOptions
): SolveState => {
  const initialization = buildInitialization(
    loadFlowCase,
    options.initialization
  );

  const voltageMagnitudes = loadFlowCase.buses.map((bus) => {
    if (bus.type === "SLACK" || bus.type === "PV") {
      return (
        bus.voltageMagnitudeSetpoint ??
        initialization.voltageMagnitudeByBusId[bus.id]
      );
    }

    return initialization.voltageMagnitudeByBusId[bus.id];
  });

  const voltageAnglesRad = loadFlowCase.buses.map((bus) => {
    if (bus.type === "SLACK") {
      return toRadians(bus.voltageAngleSetpointDeg ?? 0);
    }

    return toRadians(initialization.voltageAngleDegByBusId[bus.id]);
  });

  return { voltageMagnitudes, voltageAnglesRad };
};

const findIslands = (yBus: Complex[][], busTypes: BusType[]): boolean => {
  const slackIndex = busTypes.findIndex((busType) => busType === "SLACK");
  if (slackIndex === -1) {
    return true;
  }

  const visited = new Set<number>([slackIndex]);
  const queue = [slackIndex];

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined) {
      break;
    }

    for (let neighbor = 0; neighbor < yBus.length; neighbor += 1) {
      if (neighbor === current) {
        continue;
      }

      const connected =
        Math.abs(yBus[current][neighbor].re) > Number.EPSILON ||
        Math.abs(yBus[current][neighbor].im) > Number.EPSILON;

      if (connected && !visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return visited.size !== yBus.length;
};

export const solveWithNewtonRaphson = (
  loadFlowCase: LoadFlowCase,
  options: SolveOptions
): LoadFlowResult => {
  const busIndexById = Object.fromEntries(
    loadFlowCase.buses.map((bus, index) => [bus.id, index])
  );

  const yBus = buildYBus(loadFlowCase, busIndexById);

  if (
    findIslands(
      yBus,
      loadFlowCase.buses.map((bus) => bus.type)
    )
  ) {
    return {
      diagnostics: {
        converged: false,
        algorithm: options.algorithm,
        initialization: options.initialization,
        message:
          "Network contains an electrical island that is disconnected from the slack bus.",
        iterationsCompleted: 0,
        maxMismatchPu: null,
        iterationMaxMismatchPu: [],
      },
    };
  }

  const state = getInitialState(loadFlowCase, options);
  const specified = computeSpecifiedInjections(loadFlowCase, busIndexById);
  const partitions = getBusPartitions(loadFlowCase.buses);

  let maxMismatchPu = Number.POSITIVE_INFINITY;
  const iterationMaxMismatchPu: number[] = [];
  let pCalculated: number[] = [];
  let qCalculated: number[] = [];

  for (let iteration = 0; iteration < options.maxIterations; iteration += 1) {
    const calculated = calculatePowerInjections(yBus, state);
    pCalculated = calculated.pCalculated;
    qCalculated = calculated.qCalculated;

    const mismatch = buildMismatchVector(
      partitions,
      specified,
      pCalculated,
      qCalculated
    );
    maxMismatchPu = getMaximumAbsolute(mismatch);
    iterationMaxMismatchPu.push(maxMismatchPu);

    if (maxMismatchPu <= options.tolerance) {
      return {
        buses: buildSolvedBusStates(
          loadFlowCase,
          state,
          pCalculated,
          qCalculated
        ),
        branchFlows: buildBranchFlows(loadFlowCase, busIndexById, state),
        diagnostics: {
          converged: true,
          algorithm: options.algorithm,
          initialization: options.initialization,
          message: `Converged in ${iteration} iterations.`,
          iterationsCompleted: iteration,
          maxMismatchPu,
          iterationMaxMismatchPu,
        },
      };
    }

    const jacobian = buildJacobian(
      yBus,
      state,
      partitions,
      pCalculated,
      qCalculated
    );

    let deltaState: number[];
    try {
      deltaState = solveLinearSystem(jacobian, mismatch);
    } catch {
      return {
        diagnostics: {
          converged: false,
          algorithm: options.algorithm,
          initialization: options.initialization,
          message:
            "Power flow failed because the Jacobian matrix became singular.",
          iterationsCompleted: iteration,
          maxMismatchPu,
          iterationMaxMismatchPu,
        },
      };
    }

    partitions.nonSlack.forEach((busIndex, index) => {
      state.voltageAnglesRad[busIndex] += deltaState[index] * options.damping;
    });
    partitions.pq.forEach((busIndex, index) => {
      const deltaV = deltaState[partitions.nonSlack.length + index];
      state.voltageMagnitudes[busIndex] += deltaV * options.damping;
    });
  }

  const finalCalculated = calculatePowerInjections(yBus, state);

  return {
    buses: buildSolvedBusStates(
      loadFlowCase,
      state,
      finalCalculated.pCalculated,
      finalCalculated.qCalculated
    ),
    branchFlows: buildBranchFlows(loadFlowCase, busIndexById, state),
    diagnostics: {
      converged: false,
      algorithm: options.algorithm,
      initialization: options.initialization,
      message: `Did not converge after ${options.maxIterations} iterations.`,
      iterationsCompleted: options.maxIterations,
      maxMismatchPu,
      iterationMaxMismatchPu,
    },
  };
};
