import { ReactNode } from "react";

import { Chip } from "@/components/Chip";

type BadgeTone = "info" | "success" | "warning";

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
};

const toneClasses: Record<BadgeTone, string> = {
  info: "border-accent-info/30 bg-accent-info/10 text-accent-info",
  success: "border-accent-success/40 bg-accent-success/15 text-accent-success",
  warning: "border-accent-warning/40 bg-accent-warning/15 text-accent-warning",
};

export function Badge({ children, tone = "info", className = "" }: BadgeProps) {
  return (
    <Chip className={`${toneClasses[tone]} ${className}`.trim()}>
      {children}
    </Chip>
  );
}
