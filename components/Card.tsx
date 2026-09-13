import Link from "next/link";
import type { Recipe } from "@/content/types";
import { CATEGORIES } from "@/content/taxonomy";
import { yieldLabel } from "@/lib/quantity";
import { Shot } from "./Shot";

const CAT_BY_SLUG = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c]));

export function Card({ recipe, showCat }: { recipe: Recipe; showCat: boolean }) {
  return (
    <Link className="card" href={`/recipes/${recipe.slug}`}>
      <Shot tint={recipe.tint ?? ["#3F5A43", "#1B241C"]} className="shot" />
      <h3>{recipe.title}</h3>
      <p className="meta">
        {showCat && `${CAT_BY_SLUG[recipe.category].short} · `}
        {recipe.total} min · {yieldLabel(recipe.yield)}
      </p>
    </Link>
  );
}
