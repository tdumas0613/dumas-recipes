import type { Metadata } from "next";
import { RECIPES, LIVE_CATEGORIES, CATEGORY_COUNTS, INGREDIENT_INDEX } from "@/content/recipes";
import { RecipeBrowser } from "@/components/RecipeBrowser";
import { SITE_TAGLINE, SITE_URL } from "@/lib/site";

/**
 * No `title` here: the visible h1 is "What are you cooking?", good interface
 * copy but useless as a search signal, so the <title> falls through to the
 * root layout's default — the real nouns, "Dumas Family Recipes" — instead
 * of being run through the "%s · Dumas Family Recipes" template.
 */
export function generateMetadata(): Metadata {
  return {
    description: SITE_TAGLINE,
    alternates: { canonical: SITE_URL },
  };
}

export default function Home() {
  return (
    <RecipeBrowser
      recipes={RECIPES}
      totalCount={RECIPES.length}
      liveCategories={LIVE_CATEGORIES}
      categoryCounts={CATEGORY_COUNTS}
      currentCategory={null}
      ingredientIndex={INGREDIENT_INDEX}
    />
  );
}
