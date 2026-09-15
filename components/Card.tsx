import Link from "next/link";
import type { Recipe } from "@/content/types";
import { CATEGORIES } from "@/content/taxonomy";
import { yieldLabel } from "@/lib/quantity";
import { Shot } from "./Shot";

const CAT_BY_SLUG = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c]));

export function Card({ recipe, showCat }: { recipe: Recipe; showCat: boolean }) {
  return (
    <Link className="card" href={`/recipes/${recipe.slug}`}>
      <Shot className="shot" />
      <h3>{recipe.title}</h3>
      <p className="meta">
        {showCat && <span className="cat">{CAT_BY_SLUG[recipe.category].short} </span>}
        {showCat && "· "}
        {recipe.total} min · {yieldLabel(recipe.yield)}
      </p>
    </Link>
  );
}
