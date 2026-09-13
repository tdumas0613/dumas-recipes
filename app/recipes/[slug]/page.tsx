import { notFound } from "next/navigation";
import { RECIPES, getRecipeBySlug } from "@/content/recipes";
import { RecipeDetail } from "@/components/RecipeDetail";

export const dynamicParams = false;

export function generateStaticParams() {
  return RECIPES.map((r) => ({ slug: r.slug }));
}

export default async function RecipePage(props: PageProps<"/recipes/[slug]">) {
  const { slug } = await props.params;
  const recipe = getRecipeBySlug(slug);
  if (!recipe) notFound();

  return <RecipeDetail recipe={recipe} />;
}
