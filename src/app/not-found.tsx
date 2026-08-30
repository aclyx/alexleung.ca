import Link from "next/link";

import { actionClassNames } from "@/components/controlStyles";

export default function NotFound() {
  return (
    <div className="flex grow items-center justify-center bg-paper px-5 py-16 text-ink">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold">404</h1>
        <h2 className="mb-6 text-2xl">Page Not Found</h2>
        <p className="mb-8 text-lg text-muted">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/" className={actionClassNames({ className: "px-6 py-3" })}>
          Back home
        </Link>
      </div>
    </div>
  );
}
