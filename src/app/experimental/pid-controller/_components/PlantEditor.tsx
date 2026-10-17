"use client";

import { useState } from "react";

import { actionClassNames } from "@/components/controlStyles";
import {
  DisclosureIndicator,
  disclosureSummaryClassNames,
} from "@/components/Disclosure";
import { Plant } from "@/features/pid-simulator/plants";
import { validatePlant } from "@/features/pid-simulator/simulation";

const inputClass =
  "mt-2 block min-h-11 w-full min-w-0 rounded-sm border border-line bg-paper px-3 py-2 font-mono text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-link";

export function PlantEditor({
  plant,
  onApply,
}: {
  plant: Plant;
  onApply: (plant: Plant) => void;
}) {
  const [order, setOrder] = useState<1 | 2>(plant.order);
  const [error, setError] = useState<string | null>(null);
  const fields = [
    {
      name: "initialValue",
      label: "Initial output · y(0)",
      value: plant.initialValue,
    },
    ...(order === 2
      ? [
          {
            name: "initialVelocity",
            label: "Initial velocity · v(0)",
            value: plant.initialVelocity,
          },
        ]
      : []),
    { name: "target", label: "Target", value: plant.target },
    { name: "outputMin", label: "Minimum input · u", value: plant.outputMin },
    { name: "outputMax", label: "Maximum input · u", value: plant.outputMax },
  ];

  return (
    <details className="group mt-4 border-t border-line">
      <summary className={disclosureSummaryClassNames({ className: "px-0" })}>
        Edit plant equation & settings
        <DisclosureIndicator />
      </summary>
      <form
        className="pb-5 pt-2"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const number = (name: string) => {
            const value = data.get(name);
            return typeof value === "string" && value.trim()
              ? Number(value)
              : NaN;
          };
          try {
            const next: Plant = {
              id: "custom",
              name: "Custom plant",
              description: "A plant defined by your equation.",
              order,
              equation: String(data.get("equation") ?? ""),
              initialValue: number("initialValue"),
              initialVelocity: order === 2 ? number("initialVelocity") : 0,
              target: number("target"),
              outputMin: number("outputMin"),
              outputMax: number("outputMax"),
              unit: String(data.get("unit") ?? "").trim(),
              controlUnit: String(data.get("controlUnit") ?? "").trim(),
            };
            validatePlant(next);
            setError(null);
            onApply(next);
          } catch (cause) {
            setError(
              cause instanceof Error
                ? cause.message
                : "Check the plant settings."
            );
          }
        }}
      >
        <div className="grid gap-4 md:grid-cols-[12rem_minmax(0,1fr)]">
          <label className="text-sm" htmlFor="pid-order">
            Equation order
            <select
              id="pid-order"
              className={inputClass}
              value={order}
              onChange={(event) => setOrder(event.target.value === "2" ? 2 : 1)}
            >
              <option value="1">First order</option>
              <option value="2">Second order</option>
            </select>
          </label>
          <label className="text-sm" htmlFor="pid-equation">
            {order === 1 ? "dy/dt =" : "d²y/dt² ="}
            <input
              id="pid-equation"
              name="equation"
              className={inputClass}
              defaultValue={plant.equation}
              required
              maxLength={300}
              autoComplete="off"
              spellCheck={false}
              aria-describedby="pid-equation-help"
            />
          </label>
        </div>
        <p
          id="pid-equation-help"
          className="mt-3 text-sm leading-relaxed text-muted"
        >
          y = output, u = controller input, t = seconds
          {order === 2 ? ", v = dy/dt" : ""}. Use * for multiplication and ^ for
          powers. Functions: sin, cos, abs, sqrt, exp, log, min(a, b), max(a,
          b). Constants: pi, e.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3">
          {fields.map((field) => (
            <label
              key={field.name}
              className="text-sm"
              htmlFor={`pid-${field.name}`}
            >
              {field.label}
              <input
                id={`pid-${field.name}`}
                name={field.name}
                type="number"
                step="any"
                min={-10000}
                max={10000}
                required
                defaultValue={field.value}
                className={inputClass}
              />
            </label>
          ))}
          <label className="text-sm" htmlFor="pid-unit">
            Output unit
            <input
              id="pid-unit"
              name="unit"
              maxLength={16}
              defaultValue={plant.unit}
              className={inputClass}
            />
          </label>
          <label className="text-sm" htmlFor="pid-controlUnit">
            Input unit
            <input
              id="pid-controlUnit"
              name="controlUnit"
              maxLength={16}
              defaultValue={plant.controlUnit}
              className={inputClass}
            />
          </label>
        </div>
        {error ? (
          <p role="alert" className="mt-4 text-sm text-ink">
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className={actionClassNames({ variant: "secondary", size: "sm" })}
          >
            Apply plant
          </button>
          <p className="text-xs text-muted">
            Keeps your gains; clears the snapshot. Changes apply only when
            submitted.
          </p>
        </div>
      </form>
    </details>
  );
}
