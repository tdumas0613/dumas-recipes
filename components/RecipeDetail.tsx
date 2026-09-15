"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Minus, Plus } from "lucide-react";
import { CATEGORIES, UNITS, type UnitFamily } from "@/content/taxonomy";
import type { Recipe } from "@/content/types";
import { display, yieldLabel } from "@/lib/quantity";
import { Shot } from "./Shot";

const CAT_BY_SLUG = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c]));
const FAMILY_BY_UNIT: Record<string, UnitFamily> = Object.fromEntries(
  UNITS.map((u) => [u.name, u.family])
);

const CAUTION_TEXT: Record<string, (factor: number) => string> = {
  "†": (factor) =>
    factor > 1
      ? "Leavening doesn't scale straight. For a doubled batch use about 1¾×, not 2× — more than that and the crumb goes coarse, then collapses."
      : "Leavening doesn't scale straight. Measure this one carefully; a scaled-down quantity is easy to get wrong.",
  "‡": () =>
    "Salt, spices and extracts read stronger than the math suggests. Start at about 1½× when scaling up and adjust at the end.",
  "§": () => "Whole items don't divide. Round to the nearest one, or beat and weigh — a large egg is roughly 50 g.",
};

export function RecipeDetail({ recipe }: { recipe: Recipe }) {
  const y = recipe.yield;
  const fixed = y.kind === "fixed";
  const [serves, setServes] = useState(fixed ? 1 : y.serves);
  const [mult, setMult] = useState(1);
  const factor = fixed ? mult : serves / y.serves;
  const cat = CAT_BY_SLUG[recipe.category];

  const cautions: string[] = [];
  const rows = recipe.ingredients.map((i, n) => {
    const scaled = i.qty === undefined ? undefined : i.qty * factor;
    const d = scaled === undefined ? null : display(scaled, i.unit);
    let marker: string | null = null;
    if (factor !== 1) {
      if (i.scaling === "leavening") marker = "†";
      else if (i.scaling === "taste") marker = "‡";
      else if (d?.rounded && FAMILY_BY_UNIT[i.unit] === "count") marker = "§";
    }
    if (marker && !cautions.includes(marker)) cautions.push(marker);
    return { i, n, d, marker };
  });

  return (
    <div className="wrap">
      <Link className="back" href="/">
        <ArrowLeft size={16} /> All recipes
      </Link>
      <header className="dhead">
        <h1>{recipe.title}</h1>
        <p className="blurb">{recipe.blurb}</p>
        <div className="dmeta">
          <span>
            <b>{recipe.active} min</b> hands on
          </span>
          <span>
            <b>{recipe.total} min</b> start to finish
          </span>
          <Link href={`/${cat.slug}`}>{cat.label}</Link>
          {recipe.attrs.length > 0 && <span>{recipe.attrs.join(", ")}</span>}
        </div>
      </header>

      <Shot className="dshot" />

      <div className="cols">
        <aside className="rail">
          <div className="railhead">
            <h2>Ingredients</h2>
            {fixed ? (
              <div className="mults">
                {[1, 2, 3].map((m) => (
                  <button key={m} data-on={mult === m} onClick={() => setMult(m)}>
                    ×{m}
                  </button>
                ))}
              </div>
            ) : (
              <div className="scaler">
                <button
                  onClick={() => setServes((s) => Math.max(1, s - 1))}
                  aria-label="Fewer servings"
                >
                  <Minus size={14} />
                </button>
                <span>serves {serves}</span>
                <button
                  onClick={() => setServes((s) => Math.min(24, s + 1))}
                  aria-label="More servings"
                >
                  <Plus size={14} />
                </button>
              </div>
            )}
          </div>

          <p className="yieldline">
            {fixed ? (
              <>
                {yieldLabel(y, mult)}
                {y.cuts ? `, ${y.cuts * mult} slices` : ""}
                {y.pan ? ` · ${y.pan}` : ""}
                {mult > 1 ? ` · use ${mult} pans, not one larger one` : ""}
              </>
            ) : (
              `Written for ${y.serves}`
            )}
          </p>

          {rows.map(({ i, n, d, marker }) => (
            <div className="ing" key={n}>
              <span className="q">
                {d ? `${d.text} ${d.unit}`.trim() : i.qtyText}
                {marker && <span className="mark-c">{marker}</span>}
                {i.g && <span className="g">{Math.round((i.g * factor) / 5) * 5} g</span>}
              </span>
              <span>
                <span className="name">{i.item}</span>
                {i.note && <span className="note">, {i.note}</span>}
              </span>
            </div>
          ))}

          {cautions.length > 0 && (
            <div className="cautions">
              {cautions.map((c) => (
                <p className="caution" key={c}>
                  <span className="s">{c}</span>
                  <span>{CAUTION_TEXT[c](factor)}</span>
                </p>
              ))}
            </div>
          )}

          <div className="ad rail">advertisement · 300 × 250</div>
        </aside>

        <div className="steps">
          {recipe.steps.map((s, n) => (
            <div className="step" key={n}>
              <p>{s}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
