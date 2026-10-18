type DisclosureClassNameOptions = {
  className?: string;
};

export function disclosureSummaryClassNames({
  className = "",
}: DisclosureClassNameOptions = {}) {
  return [
    "flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-ink transition-colors hover:bg-accent-secondary-soft/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-link [&::-webkit-details-marker]:hidden",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export function DisclosureIndicator() {
  return (
    <span
      aria-hidden="true"
      className="text-lg font-normal leading-none text-muted transition-[rotate] duration-200 ease-expo-out group-open:rotate-90"
    >
      ›
    </span>
  );
}
