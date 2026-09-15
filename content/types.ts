import type { Attribute, CategorySlug } from "./taxonomy";

/**
 * One recipe = one JSON file at content/recipes/<slug>.json
 */

/**
 * How an ingredient behaves when the recipe is scaled.
 *
 * Everything scales linearly in the arithmetic — we never silently alter a
 * number the cook didn't ask us to alter. These tags only decide whether a
 * caution is shown alongside the scaled amount.
 *
 *  linear     (default) multiply and forget
 *  leavening  baking soda/powder/yeast. Doubling a batch wants roughly
 *             1.75x, not 2x, or the crumb goes coarse and then collapses.
 *  taste      salt, spices, extracts. Perception doesn't track volume.
 */
export type ScalingBehavior = "linear" | "leavening" | "taste";

export interface Ingredient {
  /** Must be a canonical name from INGREDIENTS. Never a raw import string. */
  item: string;
  /** Must be a unit name from UNITS. Empty string for countable things. */
  unit: string;
  /** Scales with yield. Omit only when qtyText is set. */
  qty?: number;
  /** Upper bound for a range: qty 2, qtyMax 3 renders "2–3 tbsp". */
  qtyMax?: number;
  /** For genuinely unmeasurable amounts: "to taste", "a splash". */
  qtyText?: string;
  /** Preparation, not identity. "minced", "bone-in", "fridge cold". */
  note?: string;
  /** Default "linear". */
  scaling?: ScalingBehavior;
  /**
   * Optional weight in grams for the authored quantity. Worth filling in for
   * dry baking ingredients and nothing else: a cup of flour varies by 20%
   * depending on how it was scooped, and that error compounds when scaling.
   * Displayed in parentheses when present. An importer must not guess this.
   */
  g?: number;
}

/**
 * Two kinds of recipe, and conflating them is what produces "0.1 cups of
 * butter".
 *
 *  servings  Divisible. A stew serving 4 genuinely makes 4 portions and
 *            halving it makes 2. Scale freely.
 *  fixed     Indivisible. A loaf "serves 10" because it cuts into 10 slices,
 *            not because it's a 10-portion recipe. You cannot bake a fifth
 *            of a loaf — the pan is the real constraint. Whole multiples only.
 */
export type Yield =
  | { kind: "servings"; serves: number }
  | {
      kind: "fixed";
      /** "loaf", "pie", "9x13 pan" */
      noun: string;
      plural: string;
      count?: number;
      /** How many pieces it cuts into, for planning. */
      cuts?: number;
      /** Stated so a doubled batch doesn't go into one overfilled pan. */
      pan?: string;
    };

export interface Source {
  kind: "original" | "url" | "file" | "card";
  ref?: string;
  credit?: string;
}

export interface Recipe {
  /** Must equal the filename. Permanent — it is the URL. */
  slug: string;
  title: string;
  category: CategorySlug;
  attrs: Attribute[];

  /** Your own words. Never imported verbatim from a source. */
  blurb: string;

  yield: Yield;
  /** Minutes. */
  active: number;
  total: number;

  ingredients: Ingredient[];
  steps: string[];

  source: Source;
  /** ISO date. */
  added: string;

  image?: { src: string; alt: string };
}
