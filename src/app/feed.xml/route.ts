import { getAllPosts } from "@/lib/blogApi";
import { buildRssFeedXml } from "@/lib/feed";

export const dynamic = "force-static";

export function GET() {
  const posts = getAllPosts([
    "title",
    "slug",
    "date",
    "updated",
    "excerpt",
    "tags",
  ]);
  const xml = buildRssFeedXml(posts);
  const stylesheetDeclaration =
    '<?xml-stylesheet type="text/xsl" href="/feed.xsl"?>';
  const xmlWithStylesheet = xml.includes("<?xml")
    ? xml.replace(/^<\?xml[^>]*\?>/, `$&\n${stylesheetDeclaration}`)
    : `${stylesheetDeclaration}\n${xml}`;

  return new Response(xmlWithStylesheet, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
