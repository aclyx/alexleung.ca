import { LinkText } from "@/components/LinkText";
import { PageShell } from "@/components/PageShell";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";

export default function NotFound() {
  return (
    <PageShell
      eyebrow="404"
      title="Page not found"
      description="The page you’re looking for doesn’t exist."
    >
      <ResponsiveContainer>
        <nav
          aria-label="Page recovery"
          className="flex flex-wrap gap-x-6 gap-y-2"
        >
          <LinkText href="/" standalone>
            Home
          </LinkText>
          <LinkText href="/blog/" standalone>
            Writing
          </LinkText>
        </nav>
      </ResponsiveContainer>
    </PageShell>
  );
}
