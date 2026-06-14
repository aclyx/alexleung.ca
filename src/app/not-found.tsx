import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold">404</h1>
        <h2 className="mb-6 text-2xl">Page Not Found</h2>
        <p className="mb-8 text-lg text-gray-400">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-accent-primary px-6 py-3 text-white transition-colors hover:bg-accent-primary-hover"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}
