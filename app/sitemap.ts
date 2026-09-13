import type { MetadataRoute } from "next";
import { RECIPES, LIVE_CATEGORIES } from "@/content/recipes";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const home: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
  ];

  const categories: MetadataRoute.Sitemap = LIVE_CATEGORIES.map((c) => ({
    url: `${SITE_URL}/${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const recipes: MetadataRoute.Sitemap = RECIPES.map((r) => ({
    url: `${SITE_URL}/recipes/${r.slug}`,
    lastModified: r.added,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...home, ...categories, ...recipes];
}
