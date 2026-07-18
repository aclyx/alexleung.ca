import ExternalLink from "@/components/ExternalLink";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { SectionBlock } from "@/components/SectionBlock";

export function PreviousWork() {
  return (
    <ResponsiveContainer element="section">
      <SectionBlock title="Previous Work" titleId="previous-work">
        <div className="grid gap-x-12 gap-y-8 md:grid-cols-3">
          <article className="space-y-2 border-t border-white/10 pt-4">
            <h3 className="text-heading-sm font-semibold text-white">
              <ExternalLink href="https://cash.app/">Cash App</ExternalLink>
            </h3>
            <p className="text-body-sm text-gray-400">Consumer finance</p>
            <p className="text-body-sm text-gray-300">
              Led teams building backend and customer-facing systems used by
              millions of customers.
            </p>
          </article>

          <article className="space-y-2 border-t border-white/10 pt-4">
            <h3 className="text-heading-sm font-semibold text-white">
              <ExternalLink href="https://arvr.google.com/">
                Google
              </ExternalLink>
            </h3>
            <p className="text-body-sm text-gray-400">AR/AI glasses</p>
            <p className="text-body-sm text-gray-300">
              Led work across embedded software, backend services,
              infrastructure, and user-facing product.
            </p>
          </article>

          <article className="space-y-2 border-t border-white/10 pt-4">
            <h3 className="text-heading-sm font-semibold text-white">
              <ExternalLink href="https://jetsonhome.com">Jetson</ExternalLink>
            </h3>
            <p className="text-body-sm text-gray-400">Home electrification</p>
            <p className="text-body-sm text-gray-300">
              Built early customer and operations software for installation and
              service.
            </p>
          </article>
        </div>
      </SectionBlock>
    </ResponsiveContainer>
  );
}
