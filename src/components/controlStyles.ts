export type ActionVariant = "primary" | "secondary" | "quiet";
type ActionSize = "sm" | "md";
type FieldKind = "input" | "select";

const actionVariantClasses: Record<ActionVariant, string> = {
  primary:
    "border border-accent-primary bg-accent-primary text-white hover:border-accent-primary-hover hover:bg-accent-primary-hover",
  secondary:
    "border border-control-border bg-surface text-ink hover:border-accent-link/60 hover:bg-white",
  quiet:
    "border border-transparent bg-transparent text-accent-link hover:bg-accent-secondary-soft/60 hover:text-accent-link-hover",
};

const actionSizeClasses: Record<ActionSize, string> = {
  sm: "min-h-11 px-3 py-2 text-sm",
  md: "text-body min-h-11 px-5 py-2.5",
};

export function actionClassNames({
  variant = "primary",
  size = "md",
  className = "",
}: {
  variant?: ActionVariant;
  size?: ActionSize;
  className?: string;
} = {}) {
  return [
    "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-[background-color,border-color,color,opacity,translate] duration-200 ease-expo-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-link focus-visible:ring-offset-2 focus-visible:ring-offset-paper active:translate-y-px disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none",
    actionSizeClasses[size],
    actionVariantClasses[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export function fieldClassNames({
  kind = "input",
  className = "",
}: {
  kind?: FieldKind;
  className?: string;
} = {}) {
  return [
    "text-body min-h-11 w-full rounded-md border border-control-border bg-white px-4 py-2.5 text-ink placeholder:text-muted transition-[border-color] duration-150 focus:border-accent-link focus:placeholder-transparent focus:outline-none focus:ring-1 focus:ring-accent-link disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none",
    kind === "select" ? "cursor-pointer pr-10" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}
