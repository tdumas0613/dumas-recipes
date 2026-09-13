import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RECIPES, getRecipeBySlug } from "@/content/recipes";
import { RecipeDetail } from "@/components/RecipeDetail";
import { recipeJsonLd, recipeUrl } from "@/lib/recipe-schema";

export const dynamicParams = false;

export function generateStaticParams() {
  return RECIPES.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata(props: PageProps<"/recipes/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const recipe = getRecipeBySlug(slug);
  if (!recipe) return {};
  return {
    title: recipe.title,
    description: recipe.blurb,
    alternates: { canonical: recipeUrl(recipe.slug) },
  };
}

export default async function RecipePage(props: PageProps<"/recipes/[slug]">) {
  const { slug } = await props.params;
  const recipe = getRecipeBySlug(slug);
  if (!recipe) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(recipeJsonLd(recipe)) }}
      />
      <RecipeDetail recipe={recipe} />
    </>
  );
}
