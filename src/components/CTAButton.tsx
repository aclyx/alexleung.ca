import Link from "next/link";

interface CTAButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
  external?: boolean;
}

export function CTAButton({
  href,
  children,
  variant = "primary",
  className = "",
  external = false,
}: CTAButtonProps) {
  const baseStyles =
    "inline-flex min-h-11 items-center gap-2 rounded-lg px-5 py-2.5 font-semibold transition-[background-color,border-color,color,transform] duration-200 ease-expo-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-link focus-visible:ring-offset-2 focus-visible:ring-offset-paper";

  const variants = {
    primary: "bg-accent-primary text-white hover:bg-accent-primary-hover",
    secondary:
      "border border-line bg-surface text-ink hover:border-accent-link/50 hover:bg-white",
  };

  const combinedStyles = `${baseStyles} ${variants[variant]} ${className}`;

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={combinedStyles}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={combinedStyles}>
      {children}
    </Link>
  );
}
