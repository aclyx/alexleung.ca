import { RouteRepairGame } from "@/app/_components/RouteRepairGame";
import { LinkText } from "@/components/LinkText";

export default function NotFound() {
  return (
    <div className="section-center py-[calc(var(--header-height)+0.75rem)]">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 grid gap-3 text-center md:grid-cols-[auto_minmax(0,1fr)] md:items-end md:text-left">
          <h1 className="text-5xl font-black leading-none text-white md:text-6xl">
            404
          </h1>
          <div>
            <h2 className="text-heading font-semibold text-gray-100">
              Page Not Found
            </h2>
            <p className="text-body-sm mt-2 text-gray-300">
              The requested path did not resolve. Route the known paths back to
              stable endpoints, or take the direct line{" "}
              <LinkText href="/">home</LinkText>.
            </p>
          </div>
        </div>

        <RouteRepairGame />
      </div>
    </div>
  );
}
