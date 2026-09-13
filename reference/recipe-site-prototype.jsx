import React, { useState, useMemo, useRef } from "react";
import { Search, X, ArrowLeft, Minus, Plus } from "lucide-react";

/* ==================================================================
   Inlined from content/taxonomy.ts. Imperial storage throughout.
================================================================== */

const CATEGORIES = [
  { slug: "breakfast", short: "Breakfast", label: "Breakfast",
    blurb: "Things worth getting up for, and a few you can make the night before." },
  { slug: "desserts", short: "Desserts", label: "Desserts",
    blurb: "Not much baking science here. Mostly butter, sugar and restraint." },
  { slug: "appetizers", short: "Appetizers", label: "Appetizers",
    blurb: "Small things to hand round, or to eat standing up at the counter." },
  { slug: "soups-salads-sandwiches", short: "Soups & Salads", label: "Soups, Salads & Sandwiches",
    blurb: "One-bowl food. Most of these are better the day after you make them." },
  { slug: "pasta", short: "Pasta", label: "Pasta",
    blurb: "Sauces that come together in the time it takes the water to boil." },
  { slug: "beef", short: "Beef", label: "Beef",
    blurb: "Mostly the cheaper cuts, which reward attention more than the expensive ones do." },
  { slug: "chicken-pork", short: "Chicken & Pork", label: "Chicken & Pork",
    blurb: "Thighs over breasts, shoulder over loin. The fattier cut is nearly always better." },
  { slug: "sides", short: "Sides & Veg", label: "Potatoes, Veggies & Side Dishes",
    blurb: "The dishes that make everything else on the plate worth eating." },
  { slug: "misc", short: "Miscellaneous", label: "Miscellaneous",
    blurb: "Everything that refuses to sit tidily anywhere else." },
];
const CAT_BY_SLUG = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c]));
const ATTRIBUTES = ["vegetarian", "weeknight", "make-ahead", "spicy"];

/* ---- units ----
   `steps` is what that unit's real measuring tools can produce. A cup set
   gives eighths and thirds; a tablespoon gives halves and nothing finer.  */
const UNITS = [
  { name: "", family: "count", base: 1, promoteTo: false, steps: [] },
  { name: "pinch", family: "volume", base: 0.0625, promoteTo: false, steps: [0, 0.5] },
  { name: "tsp", family: "volume", base: 1, promoteTo: true, steps: [0, 0.125, 0.25, 0.5, 0.75] },
  { name: "tbsp", family: "volume", base: 3, promoteTo: true, steps: [0, 0.5] },
  { name: "fl oz", family: "volume", base: 6, promoteTo: false, steps: [0, 0.5] },
  { name: "stick", family: "volume", base: 24, promoteTo: false, steps: [0, 0.25, 0.5, 0.75] },
  { name: "cup", family: "volume", base: 48, promoteTo: true, steps: [0, 0.125, 0.25, 0.333, 0.5, 0.667, 0.75] },
  { name: "pint", family: "volume", base: 96, promoteTo: false, steps: [0, 0.5] },
  { name: "quart", family: "volume", base: 192, promoteTo: false, steps: [0, 0.25, 0.5, 0.75] },
  { name: "oz", family: "weight", base: 1, promoteTo: true, steps: [0, 0.25, 0.5, 0.75] },
  { name: "lb", family: "weight", base: 16, promoteTo: true, steps: [0, 0.25, 0.5, 0.75] },
];
const UNIT_BY_NAME = Object.fromEntries(UNITS.map((u) => [u.name, u]));

const ICATS = [
  ["veg", "Vegetables & herbs"], ["fruit", "Fruit"], ["protein", "Meat, fish & tofu"],
  ["dairy", "Dairy & eggs"], ["grain", "Grains & pasta"], ["pantry", "Pantry & spices"],
];

const CATEGORY = {
  mushrooms: "veg", "garlic cloves": "veg", "green cabbage": "veg", shallots: "veg",
  scallions: "veg", onions: "veg", spinach: "veg", "thyme sprigs": "veg",
  parsley: "veg", dill: "veg", cilantro: "veg", ginger: "veg", "red bell peppers": "veg",
  lemon: "fruit", lime: "fruit", bananas: "fruit",
  "chicken thighs": "protein", "anchovy fillets": "protein", "firm tofu": "protein", "ground beef": "protein",
  butter: "dairy", parmesan: "dairy", yogurt: "dairy", eggs: "dairy", "cheese slices": "dairy", feta: "dairy",
  linguine: "grain", breadcrumbs: "grain", "basmati rice": "grain",
  "all-purpose flour": "grain", cornstarch: "grain", "burger buns": "grain",
  "white miso": "pantry", "soy sauce": "pantry", "olive oil": "pantry",
  "red pepper flakes": "pantry", "chicken stock": "pantry", salt: "pantry",
  "black peppercorns": "pantry", "granulated sugar": "pantry", "cumin seeds": "pantry",
  "smoked paprika": "pantry", "tomato paste": "pantry", chickpeas: "pantry",
  "vegetable stock": "pantry", water: "pantry", "rice vinegar": "pantry",
  "star anise": "pantry", "brown sugar": "pantry", "vanilla extract": "pantry",
  "baking soda": "pantry", "canned tomatoes": "pantry", mustard: "pantry", pickles: "pantry",
};

/* ==================================================================
   RECIPES
================================================================== */

const RECIPES = [
  {
    slug: "miso-butter-mushroom-pasta",
    title: "Miso butter mushroom pasta",
    category: "pasta", attrs: ["vegetarian", "weeknight"],
    blurb: "The miso dissolves into the butter and the mushroom liquor and turns into something much deeper than either. Weeknight food that tastes like it took longer.",
    yield: { kind: "servings", serves: 2 }, active: 20, total: 30, tint: ["#6B5537", "#2A2119"],
    ingredients: [
      { item: "linguine", qty: 8, unit: "oz" },
      { item: "mushrooms", qty: 10, unit: "oz", note: "mixed, torn by hand" },
      { item: "butter", qty: 3, unit: "tbsp" },
      { item: "white miso", qty: 2, unit: "tbsp" },
      { item: "garlic cloves", qty: 2, unit: "", note: "sliced thin" },
      { item: "soy sauce", qty: 1, unit: "tbsp" },
      { item: "lemon", qty: 1, unit: "", note: "zest only" },
      { item: "parmesan", qty: 0.25, unit: "cup", note: "finely grated" },
    ],
    steps: [
      "Get a large skillet very hot and dry. Add the mushrooms in one layer with no fat and no salt. Leave them alone for four minutes — they will squeak, release water, then start to brown.",
      "Add the butter and garlic. Cook two minutes until the garlic is pale gold.",
      "Meanwhile boil the linguine in well-salted water, one minute short of the package time. Save a mug of the water before draining.",
      "Mash the miso with a splash of pasta water into a loose paste, then stir it into the mushrooms off the heat. Miso turns bitter if you boil it hard.",
      "Add the pasta, soy sauce, and enough pasta water to make a glossy sauce. Toss hard for a minute — the agitation is what emulsifies it.",
      "Finish with lemon zest and parmesan. No salt until you have tasted it; the miso and soy do most of the work.",
    ],
  },
  {
    slug: "smash-burgers-burnt-onion",
    title: "Smash burgers with burnt onion",
    category: "beef", attrs: ["weeknight"],
    blurb: "The onions go under the patty and fry into it. Thirty seconds too long is better than thirty seconds too short.",
    yield: { kind: "servings", serves: 4 }, active: 20, total: 25, tint: ["#7E3F2C", "#291712"],
    ingredients: [
      { item: "ground beef", qty: 1, unit: "lb", note: "80/20, not leaner" },
      { item: "onions", qty: 1, unit: "", note: "sliced paper thin" },
      { item: "burger buns", qty: 4, unit: "" },
      { item: "cheese slices", qty: 4, unit: "" },
      { item: "mustard", qty: 2, unit: "tbsp" },
      { item: "pickles", qty: 4, unit: "" },
      { item: "salt", qty: 1, unit: "tsp", scaling: "taste" },
    ],
    steps: [
      "Divide the beef into four loose balls. Do not compact them, do not season them yet. Chill until you are ready.",
      "Get a heavy cast iron skillet or griddle as hot as it will go. Toast the cut buns in a dry corner of it and set aside.",
      "Lay a small pile of sliced onion on the hot metal, put a ball of beef on top, and smash it flat and thin with a stiff spatula. Hold for ten seconds so it takes the shape.",
      "Salt the top. Leave 90 seconds until the edges are lacy and dark brown, then scrape under it firmly — that crust is stuck to the pan and it is the entire dish.",
      "Flip, cheese on immediately, 30 seconds more. Stack onto the bun with mustard and pickles while everything is still too hot to handle.",
    ],
  },
  {
    slug: "shakshuka",
    title: "Shakshuka with feta",
    category: "breakfast", attrs: ["vegetarian", "weeknight"],
    blurb: "The sauce should be thick enough to hold a dent before the eggs go in. Watery shakshuka is just eggs in soup.",
    yield: { kind: "servings", serves: 4 }, active: 15, total: 35, tint: ["#8C4126", "#2A1610"],
    ingredients: [
      { item: "red bell peppers", qty: 2, unit: "", note: "sliced" },
      { item: "onions", qty: 1, unit: "", note: "sliced" },
      { item: "garlic cloves", qty: 3, unit: "" },
      { item: "cumin seeds", qty: 2, unit: "tsp", scaling: "taste" },
      { item: "smoked paprika", qty: 2, unit: "tsp", scaling: "taste" },
      { item: "canned tomatoes", qty: 28, unit: "oz", note: "crushed" },
      { item: "eggs", qty: 6, unit: "" },
      { item: "feta", qty: 4, unit: "oz" },
      { item: "cilantro", qty: 0.5, unit: "cup", note: "roughly chopped" },
      { item: "olive oil", qty: 2, unit: "tbsp" },
    ],
    steps: [
      "Cook the peppers and onion in the oil over medium heat for 12 minutes until soft and starting to catch at the edges.",
      "Garlic and spices, one minute, then the tomatoes. Crush them further with a spoon.",
      "Simmer hard and uncovered for 15 minutes. Drag a spoon through it — the channel should stay open for a second. If it fills straight in, keep going.",
      "Make six wells and crack an egg into each. Cover and cook 6 to 8 minutes, until the whites are set and the yolks still move.",
      "Crumble the feta over, cilantro on top, and bring the pan to the table.",
    ],
  },
  {
    slug: "charred-cabbage-anchovy-breadcrumbs",
    title: "Charred cabbage, anchovy breadcrumbs",
    category: "sides", attrs: [],
    blurb: "A whole cabbage wedge treated like a steak. The anchovies melt away completely and leave behind something savory that nobody can identify.",
    yield: { kind: "servings", serves: 4 }, active: 15, total: 45, tint: ["#3F5A43", "#1B241C"],
    ingredients: [
      { item: "green cabbage", qty: 1, unit: "", note: "cut into 6 wedges, core intact" },
      { item: "olive oil", qty: 0.25, unit: "cup" },
      { item: "anchovy fillets", qty: 6, unit: "" },
      { item: "breadcrumbs", qty: 1, unit: "cup", note: "coarse, from stale bread" },
      { item: "garlic cloves", qty: 2, unit: "" },
      { item: "red pepper flakes", qty: 1, unit: "tsp", scaling: "taste" },
      { item: "lemon", qty: 1, unit: "" },
    ],
    steps: [
      "Heat the oven to 425°F. Lay the cabbage wedges cut side down on a sheet pan, brush with half the oil, season, and roast 30 minutes until the flat faces are properly blackened at the edges.",
      "While that happens, warm the rest of the oil in a small pan with the anchovies. Press them with a spoon — after three minutes they will have disappeared into the oil.",
      "Add garlic and pepper flakes, thirty seconds, then the breadcrumbs. Stir constantly until deep gold and crunchy, about four minutes.",
      "Pile the breadcrumbs over the hot cabbage and squeeze lemon over everything at the table, not before.",
    ],
  },
  {
    slug: "lemon-chicken-thighs",
    title: "Lemon chicken thighs, crisp skin",
    category: "chicken-pork", attrs: ["weeknight"],
    blurb: "Started in a cold pan, which sounds wrong and is the entire trick. The fat renders slowly and the skin ends up like glass.",
    yield: { kind: "servings", serves: 4 }, active: 10, total: 40, tint: ["#8A6B2E", "#2C2415"],
    ingredients: [
      { item: "chicken thighs", qty: 8, unit: "", note: "bone-in, skin on" },
      { item: "olive oil", qty: 1, unit: "tbsp" },
      { item: "lemon", qty: 2, unit: "", note: "one sliced, one juiced" },
      { item: "garlic cloves", qty: 4, unit: "", note: "whole, skin on" },
      { item: "thyme sprigs", qty: 6, unit: "" },
      { item: "chicken stock", qty: 0.5, unit: "cup" },
      { item: "salt", qty: 1, unit: "tsp", scaling: "taste" },
    ],
    steps: [
      "Dry the skin thoroughly with paper towel and salt it. If you have an hour, leave it uncovered in the fridge — this matters more than anything else here.",
      "Lay the thighs skin down in a cold, dry, heavy pan. Turn the heat to medium-low. Walk away for 18 minutes.",
      "The skin should be deep amber and release without sticking. If it sticks, it isn't ready. Turn them over.",
      "Add the garlic, thyme, lemon slices and stock. Simmer 12 minutes until the thighs register 175°F at the bone.",
      "Lift the chicken out, reduce the pan juices for two minutes, add the lemon juice, and pour around — never over — the chicken.",
    ],
  },
  {
    slug: "black-pepper-tofu",
    title: "Black pepper tofu",
    category: "misc", attrs: ["vegetarian", "spicy", "weeknight"],
    blurb: "An indecent amount of freshly cracked pepper. Do not substitute pre-ground; the whole dish is built on that one ingredient being good.",
    yield: { kind: "servings", serves: 3 }, active: 25, total: 35, tint: ["#4A3B4E", "#1F1A22"],
    ingredients: [
      { item: "firm tofu", qty: 14, unit: "oz", note: "pressed, cubed" },
      { item: "cornstarch", qty: 3, unit: "tbsp" },
      { item: "black peppercorns", qty: 0.25, unit: "cup", note: "coarsely cracked", scaling: "taste" },
      { item: "butter", qty: 4, unit: "tbsp" },
      { item: "shallots", qty: 6, unit: "", note: "sliced" },
      { item: "garlic cloves", qty: 4, unit: "" },
      { item: "ginger", qty: 2, unit: "tbsp", note: "grated" },
      { item: "soy sauce", qty: 3, unit: "tbsp" },
      { item: "granulated sugar", qty: 1, unit: "tbsp" },
      { item: "scallions", qty: 4, unit: "" },
    ],
    steps: [
      "Toss the tofu in cornstarch until every face is dusted. Fry in shallow oil until each side is crisp and pale gold. Drain on a rack, not paper.",
      "Wipe the pan. Melt the butter and cook the shallots slowly for 10 minutes until sweet and collapsing.",
      "Add garlic, ginger and the cracked pepper. Cook two minutes — the kitchen will smell aggressive. That is correct.",
      "Add soy and sugar, bubble for a minute, then fold the tofu through so it is coated but still crisp.",
      "Scallions off the heat. Serve with plain rice, which you will need.",
    ],
  },
  {
    slug: "chickpea-stew-yogurt",
    title: "Chickpea stew with cold yogurt",
    category: "soups-salads-sandwiches", attrs: ["vegetarian", "make-ahead"],
    blurb: "Cheap, forgiving, better the next day. The cold yogurt against the hot stew is the whole point, so don't stir it in.",
    yield: { kind: "servings", serves: 4 }, active: 15, total: 50, tint: ["#8A5A2B", "#2B1D12"],
    ingredients: [
      { item: "onions", qty: 2, unit: "", note: "diced" },
      { item: "garlic cloves", qty: 4, unit: "" },
      { item: "cumin seeds", qty: 2, unit: "tsp", scaling: "taste" },
      { item: "smoked paprika", qty: 1, unit: "tsp", scaling: "taste" },
      { item: "tomato paste", qty: 2, unit: "tbsp" },
      { item: "chickpeas", qty: 30, unit: "oz", note: "two 15-oz cans, drained" },
      { item: "vegetable stock", qty: 1.5, unit: "cup" },
      { item: "spinach", qty: 5, unit: "oz" },
      { item: "yogurt", qty: 0.75, unit: "cup", note: "fridge cold" },
      { item: "lemon", qty: 1, unit: "" },
    ],
    steps: [
      "Cook the onions in oil over low heat for 12 minutes until genuinely soft. Rushing this is the difference between fine and good.",
      "Add garlic, cumin and paprika, one minute, then the tomato paste. Fry the paste for two full minutes until it darkens to brick red.",
      "Chickpeas and stock in. Simmer 25 minutes uncovered, crushing about a quarter of the chickpeas against the side of the pot to thicken it.",
      "Wilt the spinach through at the end. Season hard, then add lemon juice until it tastes bright rather than lemony.",
      "Serve with a cold spoonful of yogurt on top.",
    ],
  },
  {
    slug: "soy-braised-eggs",
    title: "Soy braised eggs",
    category: "appetizers", attrs: ["vegetarian", "make-ahead"],
    blurb: "Six minutes exactly, then overnight in the braise. Keeps a week in the fridge and improves the whole time.",
    yield: { kind: "servings", serves: 6 }, active: 15, total: 60, tint: ["#6B4A2A", "#241A11"],
    ingredients: [
      { item: "eggs", qty: 6, unit: "", note: "fridge cold" },
      { item: "soy sauce", qty: 0.5, unit: "cup" },
      { item: "water", qty: 0.5, unit: "cup" },
      { item: "granulated sugar", qty: 2, unit: "tbsp" },
      { item: "rice vinegar", qty: 2, unit: "tbsp" },
      { item: "ginger", qty: 2, unit: "tbsp", note: "sliced" },
      { item: "star anise", qty: 2, unit: "", scaling: "taste" },
      { item: "scallions", qty: 2, unit: "" },
    ],
    steps: [
      "Lower the eggs into fully boiling water. Six minutes, no more, with a timer you trust.",
      "Straight into iced water for five minutes. The shock is what makes them peel cleanly.",
      "Simmer everything else together for five minutes, then cool completely. Warm braise will overcook the yolks.",
      "Peel the eggs and submerge them. Refrigerate at least four hours, ideally overnight. Turn them once if they float.",
    ],
  },
  {
    slug: "green-herb-rice",
    title: "Green herb rice",
    category: "sides", attrs: ["vegetarian", "weeknight"],
    blurb: "Uses up the half-bunches of herbs dying in the crisper drawer. Any soft herb works; hard herbs do not.",
    yield: { kind: "servings", serves: 4 }, active: 10, total: 30, tint: ["#4C6B3C", "#1D2418"],
    ingredients: [
      { item: "basmati rice", qty: 1.5, unit: "cup" },
      { item: "parsley", qty: 1.5, unit: "cup", note: "packed" },
      { item: "dill", qty: 0.75, unit: "cup" },
      { item: "cilantro", qty: 0.75, unit: "cup" },
      { item: "scallions", qty: 4, unit: "" },
      { item: "butter", qty: 3, unit: "tbsp" },
      { item: "salt", qty: 1, unit: "tsp", scaling: "taste" },
      { item: "lime", qty: 1, unit: "" },
    ],
    steps: [
      "Rinse the rice in cold water until the water runs clear — usually four changes. Skip this and you get glue.",
      "Cook by your usual method with the salt. Absorption, pilaf, rice cooker, all fine.",
      "Blitz the herbs and scallions with a splash of water into a coarse green paste. Not a smooth purée.",
      "Fold the paste and butter through the hot rice with a fork, lifting rather than stirring. Lime at the end.",
    ],
  },
  {
    slug: "brown-butter-banana-bread",
    title: "Brown butter banana bread",
    category: "desserts", attrs: ["vegetarian", "make-ahead"],
    blurb: "Browning the butter takes four extra minutes and is the only meaningful difference between this and every other banana bread.",
    yield: { kind: "fixed", noun: "loaf", plural: "loaves", count: 1, cuts: 10, pan: "9×5 inch loaf pan" },
    active: 20, total: 80, tint: ["#7A5A33", "#271D12"],
    ingredients: [
      { item: "butter", qty: 0.5, unit: "cup", note: "1 stick", g: 113 },
      { item: "bananas", qty: 4, unit: "", note: "black, not merely spotted" },
      { item: "brown sugar", qty: 0.75, unit: "cup", note: "packed", g: 160 },
      { item: "eggs", qty: 2, unit: "" },
      { item: "vanilla extract", qty: 1, unit: "tsp", scaling: "taste" },
      { item: "all-purpose flour", qty: 1.5, unit: "cup", g: 180 },
      { item: "baking soda", qty: 1, unit: "tsp", scaling: "leavening" },
      { item: "salt", qty: 0.5, unit: "tsp", scaling: "taste" },
    ],
    steps: [
      "Melt the butter in a light-colored pan and keep cooking. It will foam, quieten, then the solids will turn nut brown and it will smell like toffee. Pour it out immediately, scraping the brown bits in.",
      "Let it cool for ten minutes, then mash in the bananas and brown sugar.",
      "Beat in the eggs and vanilla. Fold in the dry ingredients until barely combined — lumps are fine, overmixing is not.",
      "Bake at 350°F for 55 to 65 minutes. A skewer should come out with a few damp crumbs, not clean.",
      "Cool in the pan for 20 minutes before turning out or it will break across the middle.",
    ],
  },
];

/* ==================================================================
   QUANTITY DISPLAY
   Use the largest unit that yields at least one whole, OR a unit where
   the amount lands almost exactly on a standard measure. Then snap to the
   fractions that unit's real tools can produce. Never print a decimal.
================================================================== */

const GLYPH = { 0.125: "⅛", 0.25: "¼", 0.333: "⅓", 0.5: "½", 0.667: "⅔", 0.75: "¾" };

function snapIn(unit, raw) {
  const whole = Math.floor(raw + 1e-9);
  const frac = raw - whole;
  const options = [...unit.steps, 1];
  let best = options[0], err = Infinity;
  for (const o of options) {
    const e = Math.abs(frac - o);
    if (e < err) { err = e; best = o; }
  }
  return whole + best;
}

function fmt(value) {
  if (value >= 10) return String(Math.round(value));
  const whole = Math.floor(value + 1e-9);
  const frac = value - whole;
  let glyph = "";
  for (const [k, g] of Object.entries(GLYPH)) {
    if (Math.abs(frac - Number(k)) < 0.02) { glyph = g; break; }
  }
  if (!glyph) return String(Math.round(value * 100) / 100);
  return whole ? `${whole}${glyph}` : glyph;
}

function display(qty, unitName) {
  const u = UNIT_BY_NAME[unitName];
  if (!u) return { text: fmt(qty), unit: unitName, rounded: false };

  if (u.family === "count") {
    const whole = Math.abs(qty - Math.round(qty)) < 0.02;
    return { text: fmt(qty), unit: "", rounded: !whole };
  }

  const base = qty * u.base;
  const ladder = UNITS
    .filter((c) => c.family === u.family && c.promoteTo)
    .sort((a, b) => b.base - a.base);

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
  const snapped = Math.max(snapIn(smallest, raw), smallest.steps[1] ?? 0.25);
  return { text: fmt(snapped), unit: smallest.name, rounded: true };
}

function yieldLabel(y, mult = 1) {
  if (y.kind === "servings") return `serves ${y.serves}`;
  const n = (y.count ?? 1) * mult;
  return `makes ${n} ${n === 1 ? y.noun : y.plural}`;
}

/* ==================================================================
   DERIVED
================================================================== */

const USE_COUNT = (() => {
  const m = new Map();
  RECIPES.forEach((r) => r.ingredients.forEach((i) => m.set(i.item, (m.get(i.item) || 0) + 1)));
  return m;
})();
const ALL_ITEMS = [...USE_COUNT.keys()].sort();
const CAT_COUNT = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, RECIPES.filter((r) => r.category === c.slug).length])
);
const LIVE_CATEGORIES = CATEGORIES.filter((c) => CAT_COUNT[c.slug] > 0);

/* ==================================================================
   STYLES
================================================================== */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Instrument+Sans:wght@400;500;600&display=swap');

.rx {
  --ink:#15181D; --surface:#1D222A; --surface-2:#262D37; --line:#323A46;
  --chalk:#EDEAE4; --muted:#939DAB; --zest:#F5D547; --zest-dim:rgba(245,213,71,.13);
  background:var(--ink); color:var(--chalk); min-height:100%;
  font-family:'Instrument Sans',system-ui,sans-serif; font-size:17px; line-height:1.6;
  -webkit-font-smoothing:antialiased;
}
.rx *,.rx *::before,.rx *::after{box-sizing:border-box}
.rx h1,.rx h2,.rx h3{font-family:'Bricolage Grotesque',system-ui,sans-serif;margin:0;line-height:1.05;letter-spacing:-.02em}
.rx p{margin:0}
.rx button{font:inherit;color:inherit;background:none;border:none;cursor:pointer;text-align:left}
.rx :focus-visible{outline:2px solid var(--zest);outline-offset:3px;border-radius:3px}

.wrap{max-width:1120px;margin:0 auto;padding:0 28px;position:relative}
.mast{display:flex;align-items:baseline;justify-content:space-between;padding:32px 0 18px;gap:20px}
.mark{font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:19px;letter-spacing:-.03em}
.mark span{font-weight:500;color:var(--muted)}
.count{color:var(--muted);font-size:14px}

.nav{display:flex;gap:22px;overflow-x:auto;padding:0 0 13px;border-bottom:1px solid var(--line);scrollbar-width:none}
.nav::-webkit-scrollbar{display:none}
.navlink{flex:none;font-size:15px;color:var(--muted);white-space:nowrap;padding-bottom:2px;border-bottom:2px solid transparent}
.navlink:hover{color:var(--chalk)}
.navlink[data-on="true"]{color:var(--zest);border-bottom-color:var(--zest)}
.navlink .n{font-size:12.5px;opacity:.6;margin-left:5px}

.hero{padding:46px 0 30px}
.hero h1{font-size:clamp(32px,5.6vw,58px);font-weight:800;max-width:24ch;text-wrap:balance}
.hero .sub{color:var(--muted);margin-top:16px;max-width:52ch;font-size:18px}
.hero .standfirst{color:var(--muted);margin-top:14px;max-width:46ch;font-size:15px}
.hero .sub + .combo{margin-top:30px}

.combo{position:relative;margin-top:22px;max-width:560px}
.box{display:flex;align-items:center;gap:9px;background:var(--surface);border:1px solid var(--line);border-radius:11px;padding:12px 13px;cursor:text}
.box[data-open="true"]{border-color:var(--zest)}
.box > svg{color:var(--muted);flex:none;margin:0 2px}
.box input{flex:1;background:none;border:none;color:var(--chalk);font:inherit;font-size:16px;padding:2px}
.box input:focus{outline:none}
.box input::placeholder{color:var(--muted)}
.boxclear{color:var(--muted);flex:none;display:grid;place-items:center;padding:4px;border-radius:100px}
.boxclear:hover{color:var(--chalk);background:var(--surface-2)}

.scrim{position:fixed;inset:0;z-index:40}
.panel{position:absolute;z-index:50;top:calc(100% + 8px);left:0;right:0;background:var(--surface);border:1px solid var(--line);border-radius:12px;box-shadow:0 18px 44px rgba(0,0,0,.55);overflow:hidden}
.list{max-height:300px;overflow-y:auto;padding:7px 0 9px}
.group{padding:9px 0 2px}
.group h4{font-family:'Instrument Sans',sans-serif;font-size:12.5px;font-weight:600;color:var(--muted);padding:0 15px 6px;margin:0}
.opt{display:flex;align-items:center;gap:11px;width:100%;padding:8px 15px;font-size:16px}
.opt:hover{background:var(--surface-2)}
.opt .n{margin-left:auto;color:var(--muted);font-size:13px}

.resbar{display:flex;justify-content:space-between;align-items:baseline;gap:20px;flex-wrap:wrap;
  padding:26px 0 22px;margin-top:30px;border-top:1px solid var(--line)}
.resbar .n{font-size:14.5px;color:var(--muted)}
.attrs{display:flex;gap:16px;flex-wrap:wrap}
.attr{font-size:14.5px;color:var(--muted)}
.attr:hover{color:var(--chalk)}
.attr[data-on="true"]{color:var(--zest)}

.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(268px,1fr));gap:26px 24px}
.card{display:flex;flex-direction:column;gap:12px}
.shot{aspect-ratio:4/3;border-radius:10px;position:relative;overflow:hidden;border:1px solid var(--line)}
.shot::after{content:"";position:absolute;inset:0;background:radial-gradient(120% 90% at 26% 18%,rgba(255,255,255,.22),transparent 58%),radial-gradient(70% 60% at 78% 88%,rgba(0,0,0,.4),transparent 60%)}
.card:hover .shot{border-color:var(--muted)}
.card h3{font-size:20.5px;font-weight:700}
.meta{color:var(--muted);font-size:14px}

.empty{padding:30px 0 70px;max-width:48ch}
.empty h3{font-size:23px;font-weight:700;margin-bottom:10px}
.empty p{color:var(--muted)}

.ad{border:1px dashed var(--line);border-radius:9px;display:grid;place-items:center;color:var(--muted);font-size:13px;margin:40px 0}
.ad.leaderboard{min-height:96px}
.ad.rail{min-height:250px;margin:26px 0 0}

.back{display:inline-flex;align-items:center;gap:7px;color:var(--muted);font-size:15px;padding:30px 0 0}
.back:hover{color:var(--chalk)}
.dhead{padding:24px 0 32px}
.dhead h1{font-size:clamp(30px,5vw,50px);font-weight:800;max-width:18ch}
.dhead .blurb{color:var(--muted);margin-top:16px;max-width:58ch;font-size:18px}
.dmeta{display:flex;gap:22px;margin-top:22px;flex-wrap:wrap;font-size:14.5px;color:var(--muted)}
.dmeta b{color:var(--chalk);font-weight:600}
.dshot{aspect-ratio:21/9;border-radius:12px;border:1px solid var(--line);position:relative;overflow:hidden}
.dshot::after{content:"";position:absolute;inset:0;background:radial-gradient(80% 110% at 22% 10%,rgba(255,255,255,.2),transparent 60%),radial-gradient(60% 80% at 84% 92%,rgba(0,0,0,.42),transparent 62%)}
.cols{display:grid;grid-template-columns:minmax(280px,350px) 1fr;gap:56px;padding:40px 0 90px;align-items:start}
.rail{position:sticky;top:26px}
.railhead{display:flex;align-items:baseline;justify-content:space-between;gap:12px;padding-bottom:6px}
.railhead h2{font-size:16px;font-weight:700}
.yieldline{color:var(--muted);font-size:14px;padding-bottom:13px;border-bottom:1px solid var(--line)}

.scaler{display:flex;align-items:center;gap:3px;border:1px solid var(--line);border-radius:100px;padding:3px}
.scaler button{width:27px;height:27px;border-radius:100px;display:grid;place-items:center;color:var(--muted)}
.scaler button:hover{background:var(--surface-2);color:var(--chalk)}
.scaler span{min-width:56px;text-align:center;font-size:13.5px;color:var(--muted)}
.mults{display:flex;gap:3px;border:1px solid var(--line);border-radius:100px;padding:3px}
.mults button{min-width:34px;height:27px;border-radius:100px;display:grid;place-items:center;font-size:13.5px;color:var(--muted)}
.mults button:hover{background:var(--surface-2);color:var(--chalk)}
.mults button[data-on="true"]{background:var(--zest-dim);color:var(--zest)}

.ing{display:flex;gap:14px;padding:11px 0;border-bottom:1px solid rgba(50,58,70,.5);font-size:16px}
.ing .q{font-variant-numeric:tabular-nums;font-weight:600;min-width:86px;color:var(--zest)}
.ing .g{color:var(--muted);font-weight:400;font-size:13.5px;display:block;margin-top:-2px}
.ing .note{color:var(--muted)}
.mark-c{color:var(--muted);font-size:12px;vertical-align:super;margin-left:3px}

.cautions{margin-top:16px;display:flex;flex-direction:column;gap:9px}
.caution{display:grid;grid-template-columns:16px 1fr;gap:9px;font-size:13.5px;color:var(--muted);line-height:1.5}
.caution .s{color:var(--zest)}

.steps{display:flex;flex-direction:column;gap:26px;counter-reset:s}
.step{display:grid;grid-template-columns:34px 1fr;gap:16px}
.step::before{counter-increment:s;content:counter(s);font-family:'Bricolage Grotesque',sans-serif;font-weight:700;font-size:20px;color:var(--zest);line-height:1.5}
.step p{font-size:17.5px;line-height:1.62;max-width:66ch}

@media (max-width:860px){
  .cols{grid-template-columns:1fr;gap:38px}
  .rail{position:static}
  .wrap{padding:0 20px}
}
`;

/* ==================================================================
   COMPONENTS
================================================================== */

function Shot({ tint, className, children }) {
  return (
    <div className={className} style={{ background: `linear-gradient(148deg, ${tint[0]}, ${tint[1]})` }}>
      {children}
    </div>
  );
}

/**
 * One search field. Typing filters recipes by title and by ingredient.
 * The panel only appears once there's something typed that matches an
 * ingredient name — it's a spelling aid, not a browse surface. Picking a
 * suggestion just puts its name in the box.
 */
function SearchField({ query, setQuery }) {
  const [dismissed, setDismissed] = useState(false);
  const inputRef = useRef(null);
  const q = query.trim().toLowerCase();

  const groups = useMemo(() => {
    if (!q) return [];
    const hits = ALL_ITEMS.filter((i) => i.includes(q) && i !== q);
    return ICATS.map(([key, label]) => ({
      key, label, items: hits.filter((i) => CATEGORY[i] === key),
    })).filter((g) => g.items.length);
  }, [q]);

  const flat = groups.flatMap((g) => g.items);
  const showPanel = !dismissed && flat.length > 0;

  const pick = (item) => { setQuery(item); setDismissed(true); inputRef.current?.blur(); };

  const onKey = (e) => {
    if (e.key === "Enter") { e.preventDefault(); if (flat.length === 1) pick(flat[0]); else setDismissed(true); }
    if (e.key === "Escape") { setDismissed(true); inputRef.current?.blur(); }
  };

  return (
    <>
      {showPanel && <div className="scrim" onClick={() => setDismissed(true)} />}
      <div className="combo">
        <div className="box" data-open={showPanel} onClick={() => inputRef.current?.focus()}>
          <Search size={18} />
          <input
            ref={inputRef} value={query}
            onChange={(e) => { setQuery(e.target.value); setDismissed(false); }}
            onKeyDown={onKey}
            placeholder="Search by name, or by an ingredient"
            aria-label="Search recipes"
          />
          {query && (
            <button className="boxclear" onClick={(e) => { e.stopPropagation(); setQuery(""); inputRef.current?.focus(); }} aria-label="Clear search">
              <X size={16} />
            </button>
          )}
        </div>

        {showPanel && (
          <div className="panel">
            <div className="list">
              {groups.map((g) => (
                <div className="group" key={g.key}>
                  <h4>{g.label}</h4>
                  {g.items.map((item) => (
                    <button key={item} className="opt" onClick={() => pick(item)}>
                      <span>{item}</span><span className="n">{USE_COUNT.get(item)}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function Card({ recipe, showCat, onOpen }) {
  return (
    <button className="card" onClick={() => onOpen(recipe.slug)}>
      <Shot tint={recipe.tint} className="shot" />
      <h3>{recipe.title}</h3>
      <p className="meta">
        {showCat && `${CAT_BY_SLUG[recipe.category].short} · `}
        {recipe.total} min · {yieldLabel(recipe.yield)}
      </p>
    </button>
  );
}

function Detail({ recipe, onBack, onCategory }) {
  const y = recipe.yield;
  const fixed = y.kind === "fixed";
  const [serves, setServes] = useState(fixed ? 1 : y.serves);
  const [mult, setMult] = useState(1);
  const factor = fixed ? mult : serves / y.serves;
  const cat = CAT_BY_SLUG[recipe.category];

  const cautions = [];
  const rows = recipe.ingredients.map((i, n) => {
    const scaled = i.qty === undefined ? undefined : i.qty * factor;
    const d = scaled === undefined ? null : display(scaled, i.unit);
    let marker = null;
    if (factor !== 1) {
      if (i.scaling === "leavening") marker = "†";
      else if (i.scaling === "taste") marker = "‡";
      else if (d?.rounded && UNIT_BY_NAME[i.unit]?.family === "count") marker = "§";
    }
    if (marker && !cautions.includes(marker)) cautions.push(marker);
    return { i, n, d, marker };
  });

  const CAUTION_TEXT = {
    "†": factor > 1
      ? "Leavening doesn't scale straight. For a doubled batch use about 1¾×, not 2× — more than that and the crumb goes coarse, then collapses."
      : "Leavening doesn't scale straight. Measure this one carefully; a scaled-down quantity is easy to get wrong.",
    "‡": "Salt, spices and extracts read stronger than the math suggests. Start at about 1½× when scaling up and adjust at the end.",
    "§": "Whole items don't divide. Round to the nearest one, or beat and weigh — a large egg is roughly 50 g.",
  };

  return (
    <div className="wrap">
      <button className="back" onClick={onBack}><ArrowLeft size={16} /> All recipes</button>
      <header className="dhead">
        <h1>{recipe.title}</h1>
        <p className="blurb">{recipe.blurb}</p>
        <div className="dmeta">
          <span><b>{recipe.active} min</b> hands on</span>
          <span><b>{recipe.total} min</b> start to finish</span>
          <button style={{ color: "var(--zest)" }} onClick={() => onCategory(cat.slug)}>{cat.label}</button>
          {recipe.attrs.length > 0 && <span>{recipe.attrs.join(", ")}</span>}
        </div>
      </header>

      <Shot tint={recipe.tint} className="dshot" />

      <div className="cols">
        <aside className="rail">
          <div className="railhead">
            <h2>Ingredients</h2>
            {fixed ? (
              <div className="mults">
                {[1, 2, 3].map((m) => (
                  <button key={m} data-on={mult === m} onClick={() => setMult(m)}>×{m}</button>
                ))}
              </div>
            ) : (
              <div className="scaler">
                <button onClick={() => setServes((s) => Math.max(1, s - 1))} aria-label="Fewer servings"><Minus size={14} /></button>
                <span>serves {serves}</span>
                <button onClick={() => setServes((s) => Math.min(24, s + 1))} aria-label="More servings"><Plus size={14} /></button>
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
              <span><span className="name">{i.item}</span>{i.note && <span className="note">, {i.note}</span>}</span>
            </div>
          ))}

          {cautions.length > 0 && (
            <div className="cautions">
              {cautions.map((c) => (
                <p className="caution" key={c}><span className="s">{c}</span><span>{CAUTION_TEXT[c]}</span></p>
              ))}
            </div>
          )}

          <div className="ad rail">Ad slot · 300 × 250</div>
        </aside>

        <div className="steps">
          {recipe.steps.map((s, n) => <div className="step" key={n}><p>{s}</p></div>)}
        </div>
      </div>
    </div>
  );
}

export default function RecipeSite() {
  const [query, setQuery] = useState("");
  const [section, setSection] = useState(null);
  const [attr, setAttr] = useState(null);
  const [open, setOpen] = useState(null);

  const cat = section ? CAT_BY_SLUG[section] : null;
  const goCategory = (slug) => { setSection(slug); setOpen(null); };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return RECIPES.filter((r) => {
      if (section && r.category !== section) return false;
      if (attr && !r.attrs.includes(attr)) return false;
      if (!q) return true;
      return r.title.toLowerCase().includes(q) ||
             r.attrs.some((a) => a.includes(q)) ||
             r.ingredients.some((i) => i.item.includes(q));
    });
  }, [query, section, attr]);

  const recipe = open && RECIPES.find((r) => r.slug === open);
  const q = query.trim();

  return (
    <div className="rx">
      <style>{CSS}</style>
      {recipe ? (
        <Detail recipe={recipe} onBack={() => setOpen(null)} onCategory={goCategory} />
      ) : (
        <div className="wrap">
          <div className="mast">
            <button className="mark" onClick={() => setSection(null)}>
              Dumas <span>Family Recipes</span>
            </button>
            <span className="count">{RECIPES.length} recipes</span>
          </div>

          <nav className="nav">
            <button className="navlink" data-on={!section} onClick={() => setSection(null)}>
              All<span className="n">{RECIPES.length}</span>
            </button>
            {LIVE_CATEGORIES.map((c) => (
              <button key={c.slug} className="navlink" data-on={section === c.slug} onClick={() => setSection(c.slug)}>
                {c.short}<span className="n">{CAT_COUNT[c.slug]}</span>
              </button>
            ))}
          </nav>

          <section className="hero">
            <h1>{cat ? cat.label : "What are you cooking?"}</h1>
            {cat && <p className="sub">{cat.blurb}</p>}
            <SearchField query={query} setQuery={setQuery} />
            {!cat && (
              <p className="standfirst">
                Recipes we've made more than once, written down properly so the
                second time is easier than the first.
              </p>
            )}
          </section>

          <div className="resbar">
            <span className="n">
              {results.length} {results.length === 1 ? "recipe" : "recipes"}
              {q && ` for “${q}”`}
            </span>
            <div className="attrs">
              <button className="attr" data-on={!attr} onClick={() => setAttr(null)}>Anything</button>
              {ATTRIBUTES.map((a) => (
                <button key={a} className="attr" data-on={attr === a} onClick={() => setAttr(attr === a ? null : a)}>{a}</button>
              ))}
            </div>
          </div>

          {results.length === 0 ? (
            <div className="empty">
              <h3>Nothing here</h3>
              <p>
                {q ? `No recipe uses “${q}” or has it in the title. Try a broader term, or clear the search.`
                   : "No recipes match that filter. Try clearing it."}
              </p>
            </div>
          ) : (
            <>
              <div className="grid">
                {results.slice(0, 6).map((r) => (
                  <Card key={r.slug} recipe={r} showCat={!section} onOpen={setOpen} />
                ))}
              </div>
              {results.length > 6 && (
                <>
                  <div className="ad leaderboard">Ad slot · 728 × 90 responsive</div>
                  <div className="grid">
                    {results.slice(6).map((r) => (
                      <Card key={r.slug} recipe={r} showCat={!section} onOpen={setOpen} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          <div style={{ height: 80 }} />
        </div>
      )}
    </div>
  );
}
