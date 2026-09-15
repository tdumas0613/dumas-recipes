#!/usr/bin/env npx tsx
/**
 * validate-recipes.ts
 *
 * Run:   npx tsx scripts/validate-recipes.ts
 * CI:    add to "prebuild" so a bad recipe can never reach production.
 *
 * This exists because the failure mode of a recipe importer is silent.
 * Nothing crashes when it writes "scallions" one week and "green onions"
 * the next — the pantry filter just gets quietly worse until it's useless
 * and the fix is editing a hundred files. This catches that on day one.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, basename, extname } from "node:path";
import {
  ATTRIBUTES,
  CATEGORY_SLUGS,
  IS_CANONICAL,
  ALIAS_MAP,
  INGREDIENTS,
  UNIT_NAMES,
  UNITS,
  resolveIngredient,
} from "../content/taxonomy";

const DIR = join(process.cwd(), "content", "recipes");
const PUBLIC = join(process.cwd(), "public");

/** Past this a source file is worth a second look before it enters git for good. */
const PHOTO_WARN_BYTES = 800_000;

type Level = "error" | "warn";
interface Issue { level: Level; file: string; msg: string; }

const issues: Issue[] = [];
const err = (file: string, msg: string) => issues.push({ level: "error", file, msg });
const warn = (file: string, msg: string) => issues.push({ level: "warn", file, msg });

const seenSlugs = new Map<string, string>();
const usage = new Map<string, number>();

/** Levenshtein, for "did you mean" on unknown ingredients. */
function near(a: string, b: string): number {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
  return d[m][n];
}

function suggest(raw: string): string {
  const pool = [...IS_CANONICAL, ...Object.keys(ALIAS_MAP)];
  const best = pool
    .map((c) => ({ c, d: near(raw.toLowerCase(), c.toLowerCase()) }))
    .sort((a, b) => a.d - b.d)[0];
  if (!best || best.d > Math.max(3, raw.length * 0.4)) return "";
  const canonical = IS_CANONICAL.has(best.c) ? best.c : ALIAS_MAP[best.c];
  return ` Did you mean "${canonical}"?`;
}

const files = readdirSync(DIR).filter((f) => extname(f) === ".json");

if (files.length === 0) {
  console.error(`No recipes found in ${DIR}`);
  process.exit(1);
}

for (const file of files) {
  let r: any;
  try {
    r = JSON.parse(readFileSync(join(DIR, file), "utf8"));
  } catch (e) {
    err(file, `Not valid JSON: ${(e as Error).message}`);
    continue;
  }

  const expected = basename(file, ".json");

  /* --- identity --- */
  if (r.slug !== expected) err(file, `slug "${r.slug}" must match the filename "${expected}".`);
  if (seenSlugs.has(r.slug)) err(file, `slug "${r.slug}" already used by ${seenSlugs.get(r.slug)}.`);
  seenSlugs.set(r.slug, file);
  if (!/^[a-z0-9-]+$/.test(r.slug ?? "")) err(file, `slug must be lowercase letters, numbers and hyphens only.`);

  /* --- classification --- */
  if (!CATEGORY_SLUGS.includes(r.category)) {
    err(file, `category "${r.category}" is not one of: ${CATEGORY_SLUGS.join(", ")}`);
  }
  for (const a of r.attrs ?? []) {
    if (!ATTRIBUTES.includes(a)) err(file, `attribute "${a}" is not one of: ${ATTRIBUTES.join(", ")}`);
  }

  /* --- prose --- */
  if (!r.title?.trim()) err(file, `title is required.`);
  if (!r.blurb?.trim()) {
    err(file, `blurb is required — it's what keeps this page from reading as duplicate content.`);
  } else if (r.blurb.length < 40) {
    warn(file, `blurb is only ${r.blurb.length} characters. Aim for 100–250.`);
  }

  /* --- provenance --- */
  if (!r.source?.kind) {
    err(file, `source.kind is required (original | url | file | card).`);
  } else if (r.source.kind !== "original" && !r.source.ref) {
    err(file, `source.ref is required when source.kind is "${r.source.kind}".`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.added ?? "")) err(file, `added must be an ISO date, e.g. 2026-09-13.`);

  /* --- numbers --- */
  for (const k of ["active", "total"]) {
    if (!Number.isFinite(r[k]) || r[k] <= 0) err(file, `${k} must be a positive number.`);
  }

  /* --- yield --- */
  const y = r.yield;
  if (!y?.kind) {
    err(file, `yield is required: { kind: "servings", serves: n } or { kind: "fixed", noun, plural }.`);
  } else if (y.kind === "servings") {
    if (!Number.isFinite(y.serves) || y.serves <= 0) err(file, `yield.serves must be a positive number.`);
    if (["desserts", "breakfast"].includes(r.category) && /bread|cake|pie|loaf|bars|cookies|muffins/i.test(r.title)) {
      warn(file, `"${r.title}" looks like a baked good but uses kind "servings". ` +
                 `A loaf cuts into slices, it doesn't divide into portions — consider kind "fixed".`);
    }
  } else if (y.kind === "fixed") {
    if (!y.noun || !y.plural) err(file, `yield.noun and yield.plural are required for fixed yields (e.g. "loaf" / "loaves").`);
    if (!y.pan) warn(file, `yield.pan is unset. A doubled batch needs to know it wants two pans, not one bigger one.`);
  } else {
    err(file, `yield.kind "${y.kind}" is not "servings" or "fixed".`);
  }
  if (Number.isFinite(r.active) && Number.isFinite(r.total) && r.active > r.total) {
    err(file, `active (${r.active} min) cannot exceed total (${r.total} min).`);
  }

  /* --- ingredients: the part that actually matters --- */
  if (!Array.isArray(r.ingredients) || r.ingredients.length === 0) {
    err(file, `at least one ingredient is required.`);
  } else {
    const seenItems = new Set<string>();
    r.ingredients.forEach((ing: any, n: number) => {
      const at = `ingredient ${n + 1}`;

      if (!ing.item) { err(file, `${at}: item is required.`); return; }

      if (!IS_CANONICAL.has(ing.item)) {
        const viaAlias = resolveIngredient(ing.item);
        if (viaAlias) {
          err(file, `${at}: "${ing.item}" is an alias. Write the canonical name "${viaAlias}".`);
        } else {
          err(file, `${at}: "${ing.item}" is not in the taxonomy.${suggest(ing.item)} ` +
                    `Add it to INGREDIENTS or map it as an alias — do not leave it loose.`);
        }
      } else {
        usage.set(ing.item, (usage.get(ing.item) ?? 0) + 1);
      }

      if (seenItems.has(ing.item)) {
        warn(file, `${at}: "${ing.item}" is listed twice. One row per ingredient — add the quantities, ` +
                  `put the split in the step text, and note it "divided".`);
      }
      seenItems.add(ing.item);

      if (ing.unit === undefined) {
        err(file, `${at}: unit is required (use "" for countable things).`);
      } else if (!UNIT_NAMES.includes(ing.unit)) {
        err(file, `${at}: unit "${ing.unit}" is not allowed. Use one of: ${UNIT_NAMES.filter(Boolean).join(", ")}`);
      }

      const hasQty = Number.isFinite(ing.qty);
      if (!hasQty && !ing.qtyText) {
        err(file, `${at}: needs a numeric qty, or qtyText like "to taste".`);
      }
      if (hasQty && ing.qty <= 0) err(file, `${at}: qty must be greater than zero.`);
      if (ing.qtyMax !== undefined) {
        if (!hasQty) err(file, `${at}: qtyMax needs a qty to bound.`);
        else if (ing.qtyMax <= ing.qty) err(file, `${at}: qtyMax must be greater than qty.`);
      }

      if (ing.scaling !== undefined && !["linear", "leavening", "taste"].includes(ing.scaling)) {
        err(file, `${at}: scaling "${ing.scaling}" must be linear, leavening or taste.`);
      }
      // These misbehave when scaled and should say so.
      if (/baking soda|baking powder|yeast/.test(ing.item) && ing.scaling !== "leavening") {
        warn(file, `${at}: "${ing.item}" should be tagged scaling:"leavening" so scaled batches get a caution.`);
      }
      if (/^(salt|.*paprika|.*pepper flakes|cumin.*|.*extract|black peppercorns)$/.test(ing.item) && ing.scaling !== "taste") {
        warn(file, `${at}: "${ing.item}" should probably be tagged scaling:"taste".`);
      }

      if (ing.g !== undefined) {
        if (!Number.isFinite(ing.g) || ing.g <= 0) err(file, `${at}: g must be a positive number of grams.`);
        if (!hasQty) err(file, `${at}: g describes the authored qty, so qty must be set.`);
      }

      // Imperial sanity: a metric number that slipped through conversion.
      const u = UNITS.find((x) => x.name === ing.unit);
      if (hasQty && u?.family === "weight" && ing.unit === "oz" && ing.qty > 64) {
        warn(file, `${at}: ${ing.qty} oz is over four pounds — did a gram value survive the conversion?`);
      }
      if (hasQty && ing.unit === "cup" && ing.qty > 12) {
        warn(file, `${at}: ${ing.qty} cups looks like a millilitre value.`);
      }
    });
  }

  /* --- steps --- */
  if (!Array.isArray(r.steps) || r.steps.length === 0) {
    err(file, `at least one step is required.`);
  } else {
    r.steps.forEach((s: any, n: number) => {
      if (typeof s !== "string" || !s.trim()) err(file, `step ${n + 1} is empty.`);
      else if (s.length < 20) warn(file, `step ${n + 1} is very short. Steps should stand alone.`);
      if (typeof s === "string" && /\b\d+\s*°?\s*C\b/.test(s)) {
        err(file, `step ${n + 1} has a Celsius temperature. This site stores Fahrenheit.`);
      }
      if (typeof s === "string" && /\b\d+\s*(g|kg|ml|l)\b/.test(s)) {
        warn(file, `step ${n + 1} mentions a metric amount. Convert it for consistency.`);
      }
    });
  }

  /* --- photograph ---
     Optional, but a broken one fails silently in two places at once: the page
     renders a dead image and the JSON-LD hands Google a 404 for the very field
     that makes a recipe eligible for a rich result. Neither shows up as a
     crash, so the path is checked here instead. */
  if (r.image !== undefined) {
    const src = r.image?.src;
    if (typeof src !== "string" || !src.trim()) {
      err(file, `image.src is required when image is set.`);
    } else if (!src.startsWith("/")) {
      err(file, `image.src "${src}" must be a site-absolute path like "/recipes/${r.slug}.jpg".`);
    } else {
      const onDisk = join(PUBLIC, src);
      if (!existsSync(onDisk)) {
        err(file, `image.src "${src}" does not exist at public${src}.`);
      } else {
        const bytes = statSync(onDisk).size;
        if (bytes > PHOTO_WARN_BYTES) {
          warn(file, `image is ${(bytes / 1_000_000).toFixed(1)} MB. next/image serves derived ` +
                     `sizes, so the source only needs to cover the largest crop — downscaling ` +
                     `before it enters git history is cheaper than doing it afterwards.`);
        }
      }
    }

    const alt = r.image?.alt;
    if (typeof alt !== "string" || !alt.trim()) {
      err(file, `image.alt is required when image is set — a photograph with no alt text is ` +
                `invisible to a screen reader and to a crawler.`);
    } else if (alt.length < 25) {
      warn(file, `image.alt is only ${alt.length} characters. Describe what's on the plate.`);
    }
  }
}

/* --- collection-wide checks --- */
for (const ing of INGREDIENTS) {
  if (!usage.has(ing.name) && !ing.staple) {
    warn("taxonomy.ts", `"${ing.name}" is defined but unused. Fine for now; delete it if it was a mistake.`);
  }
}

/* --- report --- */
const errors = issues.filter((i) => i.level === "error");
const warns = issues.filter((i) => i.level === "warn");

const byFile = new Map<string, Issue[]>();
for (const i of issues) byFile.set(i.file, [...(byFile.get(i.file) ?? []), i]);

for (const [file, list] of byFile) {
  console.log(`\n${file}`);
  for (const i of list) {
    console.log(`  ${i.level === "error" ? "✗" : "!"} ${i.msg}`);
  }
}

console.log(
  `\n${files.length} recipes · ${errors.length} errors · ${warns.length} warnings\n`
);

if (errors.length) process.exit(1);
