/** schema.org Recipe JSON-LD, built from a recipe's own JSON — no invented fields. */

import { CATEGORIES } from "@/content/taxonomy";
import type { Ingredient, Recipe } from "@/content/types";
import { display } from "./quantity";
import { SITE_URL } from "./site";

const CAT_BY_SLUG = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c]));

function isoMinutes(minutes: number): string {
  return `PT${minutes}M`;
}

function ingredientLine(ing: Ingredient): string {
  const amount =
    ing.qty === undefined
      ? (ing.qtyText ?? "")
      : (() => {
          const d = display(ing.qty as number, ing.unit);
          return `${d.text}${d.unit ? ` ${d.unit}` : ""}`;
        })();
  const line = [amount, ing.item].filter(Boolean).join(" ");
  return ing.note ? `${line}, ${ing.note}` : line;
}

function recipeYieldText(recipe: Recipe): string {
  const y = recipe.yield;
  if (y.kind === "servings") return `${y.serves} servings`;
  const n = y.count ?? 1;
  return `${n} ${n === 1 ? y.noun : y.plural}`;
}

export function recipeUrl(slug: string): string {
  return `${SITE_URL}/recipes/${slug}`;
}

export function recipeJsonLd(recipe: Recipe): Record<string, unknown> {
  const cat = CAT_BY_SLUG[recipe.category];
  const url = recipeUrl(recipe.slug);

  const json: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    description: recipe.blurb,
    author: { "@type": "Person", name: "Taylor Dumas" },
    datePublished: recipe.added,
    url,
    mainEntityOfPage: url,
    recipeCategory: cat.label,
    recipeYield: recipeYieldText(recipe),
    prepTime: isoMinutes(recipe.active),
    totalTime: isoMinutes(recipe.total),
    recipeIngredient: recipe.ingredients.map(ingredientLine),
    recipeInstructions: recipe.steps.map((text) => ({
      "@type": "HowToStep",
      text,
    })),
  };

  if (recipe.attrs.length > 0) json.keywords = recipe.attrs.join(", ");
  if (recipe.attrs.includes("vegetarian")) {
    json.suitableForDiet = "https://schema.org/VegetarianDiet";
  }
  if (recipe.image) json.image = `${SITE_URL}${recipe.image.src}`;

  return json;
}
