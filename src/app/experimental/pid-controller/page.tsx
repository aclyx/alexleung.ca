import { JsonLd } from "react-schemaorg";

import { Metadata } from "next";
import Link from "next/link";

import { WebPage } from "schema-dts";

import { JsonLdBreadcrumbs } from "@/components/JsonLdBreadcrumbs";
import { PageShell } from "@/components/PageShell";
import { ProseContent } from "@/components/ProseContent";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import {
  PID_CONTROLLER_DESCRIPTION,
  PID_CONTROLLER_PAGE_TITLE,
  PID_CONTROLLER_PATH,
  PID_CONTROLLER_TITLE,
} from "@/constants/pidController";
import { buildPageMetadata, buildWebPageSchema } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: PID_CONTROLLER_PAGE_TITLE,
  description: PID_CONTROLLER_DESCRIPTION,
  path: PID_CONTROLLER_PATH,
});

export default function PidControllerNotesPage() {
  return (
    <>
      <JsonLdBreadcrumbs
        items={[
          { name: "Home", item: "/" },
          { name: PID_CONTROLLER_TITLE, item: PID_CONTROLLER_PATH },
        ]}
      />
      <JsonLd<WebPage>
        item={buildWebPageSchema({
          path: PID_CONTROLLER_PATH,
          title: PID_CONTROLLER_PAGE_TITLE,
          description: PID_CONTROLLER_DESCRIPTION,
        })}
      />

      <PageShell
        title={PID_CONTROLLER_TITLE}
        titleId="pid-controller-notes"
        description={PID_CONTROLLER_DESCRIPTION}
      >
        <ResponsiveContainer variant="prose">
          <ProseContent size="lg">
            <p>
              I retired the interactive simulator, but kept these notes for
              anyone looking for its model and implementation details. The
              original ran entirely in the browser and plotted the response of a
              first-order process while its PID gains changed.
            </p>

            <h2>Plant and controller model</h2>
            <p>
              The simulated process followed{" "}
              <code>dy/dt = (-y + K · u) / τ</code>, where <code>y</code> was
              the process variable, <code>u</code> was the controller output,
              <code>K</code> was plant gain, and <code>τ</code> was the time
              constant. Explicit Euler integration advanced the model at a fixed
              1/60-second timestep.
            </p>
            <p>
              The controller used{" "}
              <code>u = Kp · e + Ki · ∫e dt + Kd · de/dt</code>. The integral
              state was limited to the range -4 to 4 to reduce windup, and the
              final controller output was clamped between -2 and 2 to model an
              actuator limit.
            </p>

            <h2>What the controls changed</h2>
            <ul>
              <li>
                <strong>Proportional gain</strong> changed how strongly the
                output reacted to the current error.
              </li>
              <li>
                <strong>Integral gain</strong> accumulated error to remove
                steady-state offset.
              </li>
              <li>
                <strong>Derivative gain</strong> reacted to the discrete slope
                of the error and added damping.
              </li>
              <li>
                <strong>Setpoint</strong> restarted the response so each tuning
                change could be compared from the same initial condition.
              </li>
            </ul>
            <p>
              Presets illustrated well-tuned, underdamped, overdamped, and
              oscillatory responses. Rendering used animation frames, but the
              simulation accumulated elapsed time and advanced in fixed steps,
              so its behavior did not depend on display refresh rate.
            </p>

            <h2>Archived implementation</h2>
            <p>
              The retired source is still available in the site repository: see
              the{" "}
              <a href="https://github.com/aclyx/alexleung.ca/tree/1650d234d6fcd4ecc6b4f0b06c245d1a8eac3349/src/features/pid-simulator">
                controller and simulation modules
              </a>{" "}
              and the{" "}
              <a href="https://github.com/aclyx/alexleung.ca/blob/1650d234d6fcd4ecc6b4f0b06c245d1a8eac3349/docs/pid-controller-simulator.md">
                architecture notes
              </a>
              .
            </p>
            <p>
              For a current interactive project, try the{" "}
              <Link href="/experimental/mandelbrot/">Mandelbrot explorer</Link>.
              I wrote more about building small browser tools in{" "}
              <Link href="/blog/small-interactive-tools-with-a-coding-agent/">
                Load Flow and Mandelbrot in the Browser
              </Link>
              .
            </p>
          </ProseContent>
        </ResponsiveContainer>
      </PageShell>
    </>
  );
}
