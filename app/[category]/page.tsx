import {
  RECIPES,
  LIVE_CATEGORIES,
  CATEGORY_COUNTS,
  INGREDIENT_INDEX,
  getRecipesByCategory,
} from "@/content/recipes";
import { RecipeBrowser } from "@/components/RecipeBrowser";

/** Categories with zero recipes get no page — an empty landing page is thin content and a dead end. */
export const dynamicParams = false;

export function generateStaticParams() {
  return LIVE_CATEGORIES.map((c) => ({ category: c.slug }));
}

export default async function CategoryPage(props: PageProps<"/[category]">) {
  const { category } = await props.params;
  const cat = LIVE_CATEGORIES.find((c) => c.slug === category)!;

  return (
    <RecipeBrowser
      recipes={getRecipesByCategory(cat.slug)}
      totalCount={RECIPES.length}
      liveCategories={LIVE_CATEGORIES}
      categoryCounts={CATEGORY_COUNTS}
      currentCategory={cat}
      ingredientIndex={INGREDIENT_INDEX}
    />
  );
}
