"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ATTRIBUTES,
  CATEGORIES,
  type Attribute,
  type CategorySlug,
  type CategoryDef,
} from "@/content/taxonomy";
import type { Recipe } from "@/content/types";
import type { IngredientSearchEntry } from "@/content/recipes";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import { yieldLabel } from "@/lib/quantity";
import { Card } from "./Card";
import { SearchField } from "./SearchField";

const CAT_BY_SLUG = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c]));

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

  /** Latest by `added`, for the homepage's editorial slot. On a category page
   *  this slot shows the category count instead, so `recipes` is always the
   *  full set when this is read. */
  const newest = useMemo(
    () => recipes.reduce<Recipe | null>((a, r) => (!a || r.added >= a.added ? r : a), null),
    [recipes]
  );

  return (
    <>
      <header className="band">
        <div className="wrap bandinner">
          <Link className="mark" href="/">
            {/* Reversed seal, so it sits on the flat olive band and nothing
                else. A plain <img>: next/image has nothing to optimise on an
                SVG and would only add a loader hop for the one asset that is
                on every page. alt="" because the wordmark beside it already
                names the site. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/seal-reversed.svg" alt="" width={46} height={46} />
            <span>
              <span className="markname">{SITE_NAME}</span>
              <span className="markcount">{totalCount} recipes</span>
            </span>
          </Link>
          <SearchField query={query} setQuery={setQuery} ingredientIndex={ingredientIndex} />
        </div>
      </header>

      <div className="wrap">
        {/* No per-category counts: ten of them overflowed the row at every
            width, and the numbers are already on the page — the total in the
            masthead, this category's in the hero. */}
        <nav className="nav">
          <Link className="navlink" data-on={!currentCategory} href="/">
            All
          </Link>
          {liveCategories.map((c) => (
            <Link
              key={c.slug}
              className="navlink"
              data-on={currentCategory?.slug === c.slug}
              href={`/${c.slug}`}
            >
              {c.short}
            </Link>
          ))}
        </nav>

        <section className="hero">
          <div>
            <h1>{currentCategory ? currentCategory.label : "What are you cooking?"}</h1>
            {currentCategory && <p className="sub">{currentCategory.blurb}</p>}
            {!currentCategory && <p className="standfirst">{SITE_TAGLINE}</p>}
          </div>
          {currentCategory ? (
            <p className="herocount">
              {categoryCounts[currentCategory.slug]}{" "}
              {categoryCounts[currentCategory.slug] === 1 ? "recipe" : "recipes"} in{" "}
              {currentCategory.short}
            </p>
          ) : (
            newest && (
              <Link className="newest" href={`/recipes/${newest.slug}`}>
                <span className="elabel">Newest</span>
                <span className="newesttitle">{newest.title}</span>
                <span className="newestmeta">
                  {CAT_BY_SLUG[newest.category].short} · {newest.total} min ·{" "}
                  {yieldLabel(newest.yield)}
                </span>
              </Link>
            )
          )}
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
            {/* Never leave the empty state as a dead end. On a category page
                the way back is a different URL; on the homepage it is just
                dropping the search and the filter. */}
            {currentCategory ? (
              <Link className="emptybtn" href="/">
                Back to all {totalCount} recipes
              </Link>
            ) : (
              <button
                className="emptybtn"
                onClick={() => {
                  setQuery("");
                  setAttr(null);
                }}
              >
                Back to all {totalCount} recipes
              </button>
            )}
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
                <div className="ad leaderboard">advertisement · 728 × 90</div>
                <div className="grid">
                  {results.slice(6).map((r) => (
                    <Card key={r.slug} recipe={r} showCat={!currentCategory} />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {!currentCategory && !q && !attr && results.length > 0 && (
          <aside className="pullquote">
            <span className="elabel">From the family</span>
            <p>
              Every recipe here was cooked, argued over and written down by
              someone at this table.
            </p>
          </aside>
        )}

        <div style={{ height: 80 }} />
      </div>
    </>
  );
}
