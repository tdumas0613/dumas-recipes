import { CATEGORIES } from "@/content/taxonomy";
import { RECIPES } from "@/content/recipes";
import { recipeUrl } from "@/lib/recipe-schema";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

const CAT_BY_SLUG = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c]));

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function rfc822(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toUTCString();
}

export async function GET() {
  const byDateDesc = [...RECIPES].sort((a, b) => b.added.localeCompare(a.added));
  const lastBuildDate = byDateDesc.length > 0 ? rfc822(byDateDesc[0].added) : rfc822("2026-01-01");

  const items = byDateDesc
    .map((r) => {
      const url = recipeUrl(r.slug);
      return `  <item>
    <title>${escapeXml(r.title)}</title>
    <link>${url}</link>
    <guid isPermaLink="true">${url}</guid>
    <pubDate>${rfc822(r.added)}</pubDate>
    <category>${escapeXml(CAT_BY_SLUG[r.category].label)}</category>
    <description>${escapeXml(r.blurb)}</description>
  </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">

<channel>
  <title>${escapeXml(SITE_NAME)}</title>
  <link>${SITE_URL}</link>
  <description>${escapeXml(SITE_TAGLINE)}</description>
  <language>en-us</language>
  <lastBuildDate>${lastBuildDate}</lastBuildDate>
${items}
</channel>

</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
