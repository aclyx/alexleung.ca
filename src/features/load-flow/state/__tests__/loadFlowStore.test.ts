import { toLoadFlowCase } from "@/features/load-flow/graph/toLoadFlowCase";
import {
  addBranch,
  addBus,
  autoLayoutBuses,
  createInitialLoadFlowEditorState,
  replaceEditorStateFromLoadFlowCase,
  updateBus,
} from "@/features/load-flow/state/loadFlowStore";

describe("loadFlowStore", () => {
  it("adds buses with deterministic defaults", () => {
    const initial = createInitialLoadFlowEditorState();
    const next = addBus(initial);

    expect(next.busOrder).toEqual(["bus-1"]);
    expect(next.busesById["bus-1"]).toEqual(
      expect.objectContaining({
        id: "bus-1",
        name: "Bus 1",
        type: "SLACK",
        baseKV: 230,
      })
    );

    const withSecondBus = addBus(next);
    expect(withSecondBus.busesById["bus-2"].type).toBe("PQ");
  });

  it("creates a line between existing buses and serializes graph state", () => {
    let state = createInitialLoadFlowEditorState();
    state = addBus(state);
    state = addBus(state);
    state = updateBus(state, "bus-2", { type: "PV" });

    state = addBranch(state, "bus-1", "bus-2");

    const snapshot = toLoadFlowCase(state);
    expect(snapshot.buses).toHaveLength(2);
    expect(snapshot.branches).toHaveLength(1);
    expect(snapshot.buses[1].type).toBe("PV");
    expect(snapshot.branches[0]).toEqual(
      expect.objectContaining({
        fromBusId: "bus-1",
        toBusId: "bus-2",
      })
    );
  });

  it("serializes detached DTOs without editor-only fields", () => {
    let state = createInitialLoadFlowEditorState();
    state = addBus(state, { x: 20, y: 30 });
    state = addBus(state, { x: 40, y: 50 });
    state = addBranch(state, "bus-1", "bus-2");

    const snapshot = toLoadFlowCase(state);

    expect(snapshot.buses[0]).toEqual(
      expect.objectContaining({
        id: "bus-1",
        name: "Bus 1",
        baseKV: 230,
      })
    );
    expect(snapshot.buses[0]).not.toHaveProperty("x");
    expect(snapshot.buses[0]).not.toHaveProperty("y");

    snapshot.buses[0].name = "Mutated name";
    snapshot.branches[0].r = 0.23;

    expect(state.busesById["bus-1"].name).toBe("Bus 1");
    expect(state.branchesById["line-1"].r).toBe(0.01);
  });

  it("applies auto-layout by connectivity levels", () => {
    let state = createInitialLoadFlowEditorState();
    state = addBus(state);
    state = addBus(state);
    state = addBus(state);
    state = addBranch(state, "bus-1", "bus-2");
    state = addBranch(state, "bus-2", "bus-3");

    const laidOut = autoLayoutBuses(state);
    expect(laidOut.busesById["bus-1"].x).toBe(120);
    expect(laidOut.busesById["bus-2"].x).toBe(300);
    expect(laidOut.busesById["bus-3"].x).toBe(480);
  });

  it("keeps auto-layout bus positions non-overlapping", () => {
    let state = createInitialLoadFlowEditorState();
    state = addBus(state);
    state = addBus(state);
    state = addBus(state);
    state = addBus(state);
    state = addBranch(state, "bus-1", "bus-2");
    state = addBranch(state, "bus-3", "bus-4");

    const laidOut = autoLayoutBuses(state);
    const positions = laidOut.busOrder.map((busId) => laidOut.busesById[busId]);

    const uniquePositionCount = new Set(
      positions.map((bus) => `${bus.x}-${bus.y}`)
    ).size;

    expect(uniquePositionCount).toBe(positions.length);
  });

  it("replaces editor state from a reference case including device data", () => {
    const replaced = replaceEditorStateFromLoadFlowCase({
      baseMVA: 100,
      buses: [
        {
          id: "bus-a",
          name: "A",
          baseKV: 115,
          type: "SLACK",
          voltageMagnitudeSetpoint: 1.04,
          voltageAngleSetpointDeg: 2.5,
        },
        { id: "bus-b", name: "B", baseKV: 115, type: "PQ" },
      ],
      branches: [
        {
          id: "line-a-b",
          fromBusId: "bus-a",
          toBusId: "bus-b",
          r: 0.01,
          x: 0.05,
          bHalf: 0.01,
          tapRatio: 1.02,
          phaseShiftDeg: 7.5,
        },
      ],
      generators: [
        {
          id: "gen-a",
          busId: "bus-a",
          pSet: 100,
          vSet: 1.02,
          qMin: -50,
          qMax: 80,
          status: "ON",
        },
      ],
      loads: [{ id: "load-b", busId: "bus-b", p: 70, q: 30, status: "ON" }],
      shunts: [],
    });

    const snapshot = toLoadFlowCase(replaced);
    expect(replaced.selectedElementId).toBe("bus-a");
    expect(replaced.selectedElementType).toBe("BUS");
    expect(snapshot.buses[0]).toEqual(
      expect.objectContaining({
        voltageMagnitudeSetpoint: 1.04,
        voltageAngleSetpointDeg: 2.5,
      })
    );
    expect(snapshot.branches[0]).toEqual(
      expect.objectContaining({
        tapRatio: 1.02,
        phaseShiftDeg: 7.5,
      })
    );
    expect(snapshot.generators).toHaveLength(1);
    expect(snapshot.loads).toHaveLength(1);
  });
});
