import { JsonLd } from "react-schemaorg";

import { Metadata } from "next";
import Link from "next/link";

import { CollectionPage } from "schema-dts";

import { JsonLdBreadcrumbs } from "@/components/JsonLdBreadcrumbs";
import { PageShell } from "@/components/PageShell";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { Surface } from "@/components/Surface";
import { EXPERIMENTS, EXPERIMENTS_HUB } from "@/constants/experiments";
import { buildCollectionPageSchema, buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: EXPERIMENTS_HUB.title,
  description: EXPERIMENTS_HUB.description,
  path: EXPERIMENTS_HUB.path,
});

export default function ExperimentsPage() {
  return (
    <>
      <JsonLdBreadcrumbs
        items={[
          { name: "Home", item: "/" },
          { name: EXPERIMENTS_HUB.pageTitle, item: EXPERIMENTS_HUB.path },
        ]}
      />
      <JsonLd<CollectionPage>
        item={buildCollectionPageSchema({
          path: EXPERIMENTS_HUB.path,
          title: EXPERIMENTS_HUB.title,
          description: EXPERIMENTS_HUB.description,
        })}
      />

      <PageShell
        title={EXPERIMENTS_HUB.pageTitle}
        titleId="experiments"
        className="pb-12"
      >
        <ResponsiveContainer variant="wide" className="space-y-8">
          <div className="mx-auto max-w-4xl" data-testid="experiment-intro">
            <p className="text-body text-gray-300 md:text-center">
              These are small browser tools I built to make a few systems ideas
              easier to poke at. They are static, client-side pages with
              controls, visuals, and enough state to learn from the model
              directly.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {EXPERIMENTS.map((experiment, index) => {
              const isPriorityThumbnail = index < 3;

              return (
                <Link
                  key={experiment.id}
                  href={experiment.path}
                  className="group block"
                >
                  <Surface
                    className="flex h-full flex-col overflow-hidden p-0 transition-colors hover:border-accent-secondary/40"
                    interactive
                  >
                    <div className="overflow-hidden border-b border-white/10 bg-slate-950/70">
                      <img
                        src={experiment.thumbnail.src}
                        alt={experiment.thumbnail.alt}
                        width={960}
                        height={540}
                        loading={isPriorityThumbnail ? "eager" : "lazy"}
                        fetchPriority={isPriorityThumbnail ? "high" : "auto"}
                        decoding={isPriorityThumbnail ? "sync" : "async"}
                        className="aspect-[16/9] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="flex grow flex-col justify-between p-5">
                      <div>
                        <div className="mb-3 inline-flex min-h-8 items-center rounded-full border border-accent-secondary/30 bg-accent-secondary/10 px-3 py-1 text-xs font-semibold text-accent-secondary-soft">
                          {experiment.kind}
                        </div>
                        <h2 className="text-heading-sm font-semibold text-white">
                          {experiment.pageTitle}
                        </h2>
                        <p className="text-body-sm mt-3 text-gray-300">
                          {experiment.description}
                        </p>
                      </div>
                      <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent-link transition-colors group-hover:text-accent-link-hover">
                        Open experiment
                        <span aria-hidden="true">→</span>
                      </span>
                    </div>
                  </Surface>
                </Link>
              );
            })}
          </div>
        </ResponsiveContainer>
      </PageShell>
    </>
  );
}
