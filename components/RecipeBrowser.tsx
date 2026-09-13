"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ATTRIBUTES, type Attribute, type CategorySlug, type CategoryDef } from "@/content/taxonomy";
import type { Recipe } from "@/content/types";
import type { IngredientSearchEntry } from "@/content/recipes";
import { SITE_TAGLINE } from "@/lib/site";
import { Card } from "./Card";
import { SearchField } from "./SearchField";

export function RecipeBrowser({
  recipes,
  totalCount,
  liveCategories,
  categoryCounts,
  currentCategory,
  ingredientIndex,
}: {
  /** Recipes for this page: all of them on the homepage, or one category's on a category page. */
  recipes: Recipe[];
  totalCount: number;
  liveCategories: readonly CategoryDef[];
  categoryCounts: Record<CategorySlug, number>;
  currentCategory: CategoryDef | null;
  ingredientIndex: IngredientSearchEntry[];
}) {
  const [query, setQuery] = useState("");
  const [attr, setAttr] = useState<Attribute | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return recipes.filter((r) => {
      if (attr && !r.attrs.includes(attr)) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.attrs.some((a) => a.includes(q)) ||
        r.ingredients.some((i) => i.item.includes(q))
      );
    });
  }, [recipes, query, attr]);

  const q = query.trim();

  return (
    <div className="wrap">
      <div className="mast">
        <Link className="mark" href="/">
          Dumas <span>Family Recipes</span>
        </Link>
        <span className="count">{totalCount} recipes</span>
      </div>

      <nav className="nav">
        <Link className="navlink" data-on={!currentCategory} href="/">
          All<span className="n">{totalCount}</span>
        </Link>
        {liveCategories.map((c) => (
          <Link
            key={c.slug}
            className="navlink"
            data-on={currentCategory?.slug === c.slug}
            href={`/${c.slug}`}
          >
            {c.short}
            <span className="n">{categoryCounts[c.slug]}</span>
          </Link>
        ))}
      </nav>

      <section className="hero">
        <h1>{currentCategory ? currentCategory.label : "What are you cooking?"}</h1>
        {currentCategory && <p className="sub">{currentCategory.blurb}</p>}
        <SearchField query={query} setQuery={setQuery} ingredientIndex={ingredientIndex} />
        {!currentCategory && <p className="standfirst">{SITE_TAGLINE}</p>}
      </section>

      <div className="resbar">
        <span className="n">
          {results.length} {results.length === 1 ? "recipe" : "recipes"}
          {q && ` for “${q}”`}
        </span>
        <div className="attrs">
          <button className="attr" data-on={!attr} onClick={() => setAttr(null)}>
            Anything
          </button>
          {ATTRIBUTES.map((a) => (
            <button
              key={a}
              className="attr"
              data-on={attr === a}
              onClick={() => setAttr(attr === a ? null : a)}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {results.length === 0 ? (
        <div className="empty">
          <h3>Nothing here</h3>
          <p>
            {q
              ? `No recipe uses “${q}” or has it in the title. Try a broader term, or clear the search.`
              : "No recipes match that filter. Try clearing it."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid">
            {results.slice(0, 6).map((r) => (
              <Card key={r.slug} recipe={r} showCat={!currentCategory} />
            ))}
          </div>
          {results.length > 6 && (
            <>
              <div className="ad leaderboard">Ad slot · 728 × 90 responsive</div>
              <div className="grid">
                {results.slice(6).map((r) => (
                  <Card key={r.slug} recipe={r} showCat={!currentCategory} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      <div style={{ height: 80 }} />
    </div>
  );
}
