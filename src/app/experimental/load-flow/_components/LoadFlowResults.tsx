import { LoadFlowResult } from "@/features/load-flow/solver/types";

export function LoadFlowResults({
  result,
  baseMVA,
}: {
  result: LoadFlowResult;
  baseMVA: number;
}) {
  if (!result.diagnostics.converged) return null;
  return (
    <details className="load-flow-results border-t border-line py-5">
      <summary className="min-h-11 cursor-pointer text-heading-sm">
        Bus voltages & branch flows
      </summary>
      <p className="my-3 text-sm text-muted">
        Positive terminal power enters the line; negative power leaves it. The
        two ends need not agree because of losses and line charging. Net Q can
        be negative.
      </p>
      <div
        className="overflow-x-auto"
        tabIndex={0}
        role="region"
        aria-label="Bus results table"
      >
        <table>
          <caption>Bus voltages and injections</caption>
          <thead>
            <tr>
              <th>Bus</th>
              <th>V (pu)</th>
              <th>θ (°)</th>
              <th>P injection (MW)</th>
              <th>Q injection (MVAr)</th>
            </tr>
          </thead>
          <tbody>
            {result.buses?.map((bus) => (
              <tr key={bus.busId}>
                <th scope="row">{bus.busId}</th>
                <td>{bus.voltageMagnitudePu.toFixed(4)}</td>
                <td>{bus.voltageAngleDeg.toFixed(3)}</td>
                <td>{(bus.pInjectionPu * baseMVA).toFixed(2)}</td>
                <td>{(bus.qInjectionPu * baseMVA).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div
        className="mt-6 overflow-x-auto"
        tabIndex={0}
        role="region"
        aria-label="Branch results table"
      >
        <table>
          <caption>Branch flows and losses</caption>
          <thead>
            <tr>
              <th rowSpan={2}>Branch · from → to</th>
              <th colSpan={2}>From end</th>
              <th colSpan={2}>To end</th>
              <th colSpan={2}>Net absorbed</th>
            </tr>
            <tr>
              <th>MW</th>
              <th>MVAr</th>
              <th>MW</th>
              <th>MVAr</th>
              <th>MW</th>
              <th>MVAr</th>
            </tr>
          </thead>
          <tbody>
            {result.branchFlows?.map((flow) => (
              <tr key={flow.branchId}>
                <th scope="row">
                  {flow.branchId}
                  <br />
                  <span className="font-normal text-muted">
                    {flow.fromBusId} → {flow.toBusId}
                  </span>
                </th>
                {[
                  flow.pFromToMW,
                  flow.qFromToMVar,
                  flow.pToFromMW,
                  flow.qToFromMVar,
                  flow.pLossMW,
                  flow.qLossMVar,
                ].map((value, index) => (
                  <td key={index}>{value.toFixed(2)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
