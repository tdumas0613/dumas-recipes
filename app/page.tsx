import { RECIPES, LIVE_CATEGORIES, CATEGORY_COUNTS, INGREDIENT_INDEX } from "@/content/recipes";
import { RecipeBrowser } from "@/components/RecipeBrowser";

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
