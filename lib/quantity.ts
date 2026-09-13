/**
 * quantity.ts — ingredient quantity display and scaling.
 *
 * Ported verbatim from reference/recipe-site-prototype.jsx. Never print a
 * decimal quantity, never round an amount away to zero: use the largest
 * unit that yields at least one whole, or one where the amount lands
 * within 4% of a standard measure, then snap to that unit's `steps` — the
 * fractions its real measuring tools can actually produce. See CLAUDE.md
 * for the worked examples this must keep satisfying.
 */

import { UNITS, type UnitDef } from "@/content/taxonomy";
import type { Yield } from "@/content/types";

const UNIT_BY_NAME: Record<string, UnitDef> = Object.fromEntries(
  UNITS.map((u) => [u.name, u])
);

const GLYPH: Record<number, string> = {
  0.125: "⅛",
  0.25: "¼",
  0.333: "⅓",
  0.5: "½",
  0.667: "⅔",
  0.75: "¾",
};

export interface QuantityDisplay {
  text: string;
  unit: string;
  rounded: boolean;
}

/** Snap a raw (unrounded) quantity in `unit` to the nearest step it can measure. */
export function snapIn(unit: UnitDef, raw: number): number {
  const whole = Math.floor(raw + 1e-9);
  const frac = raw - whole;
  const options = [...(unit.steps ?? []), 1];
  let best = options[0];
  let err = Infinity;
  for (const o of options) {
    const e = Math.abs(frac - o);
    if (e < err) {
      err = e;
      best = o;
    }
  }
  return whole + best;
}

/** Render a numeric quantity as a whole number plus a vulgar fraction glyph. Never a decimal. */
export function fmt(value: number): string {
  if (value >= 10) return String(Math.round(value));
  const whole = Math.floor(value + 1e-9);
  const frac = value - whole;
  let glyph = "";
  for (const [k, g] of Object.entries(GLYPH)) {
    if (Math.abs(frac - Number(k)) < 0.02) {
      glyph = g;
      break;
    }
  }
  if (!glyph) return String(Math.round(value * 100) / 100);
  return whole ? `${whole}${glyph}` : glyph;
}

/**
 * Display a scaled quantity in the best unit: the largest one that yields
 * at least one whole, or one that lands within 4% of a standard measure.
 */
export function display(qty: number, unitName: string): QuantityDisplay {
  const u = UNIT_BY_NAME[unitName];
  if (!u) return { text: fmt(qty), unit: unitName, rounded: false };

  if (u.family === "count") {
    const whole = Math.abs(qty - Math.round(qty)) < 0.02;
    return { text: fmt(qty), unit: "", rounded: !whole };
  }

  const base = qty * u.base;
  const ladder = UNITS.filter((c) => c.family === u.family && c.promoteTo).sort(
    (a, b) => b.base - a.base
  );

  for (const c of ladder) {
    const raw = base / c.base;
    if (raw < 0.05) continue;
    const snapped = snapIn(c, raw);
    if (snapped <= 0) continue;
    const near = Math.abs(snapped - raw) / raw < 0.04;
    if (raw >= 1 || near) return { text: fmt(snapped), unit: c.name, rounded: !near };
  }

  const smallest = ladder[ladder.length - 1];
  const raw = base / smallest.base;
  const snapped = Math.max(snapIn(smallest, raw), smallest.steps?.[1] ?? 0.25);
  return { text: fmt(snapped), unit: smallest.name, rounded: true };
}

/** "serves 4" or "makes 2 loaves", scaled by a whole multiplier for fixed yields. */
export function yieldLabel(y: Yield, mult = 1): string {
  if (y.kind === "servings") return `serves ${y.serves}`;
  const n = (y.count ?? 1) * mult;
  return `makes ${n} ${n === 1 ? y.noun : y.plural}`;
}
