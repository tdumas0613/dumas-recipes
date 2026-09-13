/**
 * recipes.ts — loads every recipe JSON file once, at module load time.
 *
 * Only ever imported from Server Components, so this filesystem read
 * happens during the build (or in the dev server process) and never at
 * request time in production — the result is plain data baked into the
 * statically rendered pages.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join, extname } from "node:path";
import type { Recipe } from "./types";
import {
  CATEGORIES,
  INGREDIENT_CATEGORY,
  type CategorySlug,
  type IngredientCategory,
} from "./taxonomy";

const DIR = join(process.cwd(), "content", "recipes");

function loadRecipes(): Recipe[] {
  const files = readdirSync(DIR).filter((f) => extname(f) === ".json");
  return files
    .map((f) => JSON.parse(readFileSync(join(DIR, f), "utf8")) as Recipe)
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

export const RECIPES: Recipe[] = loadRecipes();

export function getRecipeBySlug(slug: string): Recipe | undefined {
  return RECIPES.find((r) => r.slug === slug);
}

export function getRecipesByCategory(category: CategorySlug): Recipe[] {
  return RECIPES.filter((r) => r.category === category);
}

export const CATEGORY_COUNTS: Record<CategorySlug, number> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, getRecipesByCategory(c.slug).length])
) as Record<CategorySlug, number>;

/** Categories with at least one recipe. Zero-recipe categories get no nav entry and no page. */
export const LIVE_CATEGORIES = CATEGORIES.filter((c) => CATEGORY_COUNTS[c.slug] > 0);

export interface IngredientSearchEntry {
  item: string;
  count: number;
  category: IngredientCategory;
}

/** Every ingredient used across all recipes, for the search suggestion panel. */
export function buildIngredientIndex(recipes: Recipe[]): IngredientSearchEntry[] {
  const counts = new Map<string, number>();
  for (const r of recipes) {
    for (const i of r.ingredients) {
      counts.set(i.item, (counts.get(i.item) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([item, count]) => ({ item, count, category: INGREDIENT_CATEGORY[item] }))
    .sort((a, b) => a.item.localeCompare(b.item));
}

export const INGREDIENT_INDEX: IngredientSearchEntry[] = buildIngredientIndex(RECIPES);
