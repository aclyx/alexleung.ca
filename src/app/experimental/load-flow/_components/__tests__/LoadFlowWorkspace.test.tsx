import { fireEvent, render, screen, within } from "@testing-library/react";

import { getReferenceScenarioById } from "@/features/load-flow/solver/referenceScenarios";
import { runLoadFlow } from "@/features/load-flow/solver/runLoadFlow";

import { LoadFlowWorkspace } from "../LoadFlowWorkspace";

function chooseNetwork(id: string) {
  fireEvent.change(screen.getByLabelText("Network"), { target: { value: id } });
}
function inspect(id: string) {
  fireEvent.change(screen.getByLabelText("Inspect"), { target: { value: id } });
  fireEvent.click(screen.getByText("Edit selected element"));
}

test("starts with a converged three-bus network and motion on, with pause and resume", () => {
  render(<LoadFlowWorkspace />);
  expect(screen.getByLabelText("Network")).toHaveValue("three-bus-with-pv");
  expect(screen.getByRole("status")).toHaveTextContent("Converged");
  expect(screen.getByRole("button", { name: "Pause motion" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  expect(screen.getAllByTestId("flow-motion").length).toBeGreaterThan(0);
  expect(
    screen.getByRole("button", { name: /Bus Gen Bus, PV, Generator, Load/ })
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Pause motion" }));
  expect(screen.queryByTestId("flow-motion")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Animate flow" }));
  expect(screen.getAllByTestId("flow-motion").length).toBeGreaterThan(0);
});

test("keeps the original branch results table tied to solved terminal values", () => {
  render(<LoadFlowWorkspace />);
  chooseNetwork("two-bus-radial");
  fireEvent.click(screen.getByText("Bus voltages & branch flows"));
  const table = within(
    screen.getByRole("table", { name: "Branch flows and losses" })
  );
  const flow = runLoadFlow(
    getReferenceScenarioById("two-bus-radial")!.loadFlowCase
  ).branchFlows![0];
  expect(
    table.getByRole("columnheader", { name: "From end" })
  ).toBeInTheDocument();
  expect(
    table.getByRole("columnheader", { name: "To end" })
  ).toBeInTheDocument();
  for (const value of [
    flow.pFromToMW,
    flow.qFromToMVar,
    flow.pToFromMW,
    flow.qToFromMVar,
    flow.pLossMW,
    flow.qLossMVar,
  ])
    expect(table.getAllByText(value.toFixed(2)).length).toBeGreaterThan(0);
});

test("shows amounts on larger networks and can hide them", () => {
  render(<LoadFlowWorkspace />);
  chooseNetwork("ieee-14-bus");
  expect(screen.getAllByTestId("line-amount")).toHaveLength(20);
  fireEvent.click(screen.getByRole("button", { name: "Hide amounts" }));
  expect(screen.queryByTestId("line-amount")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Show amounts" }));
  expect(screen.getAllByTestId("line-amount")).toHaveLength(20);
});

test("scales loads, switches overlays, and resets without losing selection", () => {
  const { container } = render(<LoadFlowWorkspace />);
  fireEvent.change(screen.getByRole("slider"), { target: { value: "150" } });
  expect(screen.getByText("165.0 MW / 60.0 MVAr")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Q · MVAr" }));
  expect(container.querySelector('[data-component="p"]')).toBeNull();
  expect(container.querySelector('[data-component="q"]')).not.toBeNull();
  inspect("BRANCH:line-1-2");
  const reactance = screen.getByLabelText("X (pu)");
  fireEvent.change(reactance, { target: { value: "0.08" } });
  fireEvent.blur(reactance);
  fireEvent.click(screen.getByRole("button", { name: "Reset network" }));
  expect(screen.getByLabelText("Inspect")).toHaveValue("BRANCH:line-1-2");
  expect(screen.getByLabelText("X (pu)")).toHaveValue(0.06);
  expect(screen.getByRole("slider")).toHaveValue("100");
});

test("hides stale flow/voltage overlays and tables when a line outage islands a load", () => {
  const { container } = render(<LoadFlowWorkspace />);
  chooseNetwork("two-bus-radial");
  expect(screen.getAllByTestId("flow-motion").length).toBeGreaterThan(0);
  inspect("BRANCH:line-1");
  fireEvent.change(screen.getByLabelText("Line status"), {
    target: { value: "OUT_OF_SERVICE" },
  });
  expect(screen.getByRole("alert")).toHaveTextContent("island");
  expect(container.querySelector("[data-component]")).toBeNull();
  expect(screen.queryByTestId("flow-motion")).not.toBeInTheDocument();
  expect(
    screen.queryByText("Bus voltages & branch flows")
  ).not.toBeInTheDocument();
  expect(screen.getAllByText("Unsolved")).toHaveLength(2);
});

test("supports signed load edits and keyboard diagram selection", () => {
  render(<LoadFlowWorkspace />);
  const bus = screen.getByRole("button", { name: /Bus Load Bus,/ });
  fireEvent.keyDown(bus, { key: "Enter" });
  expect(screen.getByLabelText("Inspect")).toHaveValue("BUS:bus-3");
  fireEvent.click(screen.getByText("Edit selected element"));
  const q = screen.getByLabelText("Load Q (MVAr)");
  fireEvent.change(q, { target: { value: "-10" } });
  fireEvent.blur(q);
  expect(q).toHaveValue(-10);
  expect(screen.getByRole("status")).toHaveTextContent("Converged");
});
