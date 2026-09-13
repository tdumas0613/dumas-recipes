# Dumas Family Recipes

A personal recipe site. Single author for now; user accounts and display ads
are planned but deliberately **not** being built yet.

This file is the record of decisions already made. Read it before proposing
changes to architecture, schema, or vocabulary.

---

## Stack — settled, do not substitute

| Choice | Reason |
| --- | --- |
| Next.js, App Router | Recipe traffic comes from Google. A client-rendered SPA serves crawlers an empty div and never ranks. Recipe pages must be statically rendered HTML. |
| TypeScript | The taxonomy is only useful if it's type-enforced. |
| Plain CSS (one global stylesheet + CSS vars) | The prototype is written this way. No Tailwind. |
| Recipes as JSON in `content/recipes/` | An importer writes these far more often than a human edits them. JSON is safe to machine-write and trivial to validate. |
| Vercel free tier | Zero cost until a custom domain. |
| No database | Git already provides accounts, permissions and history for one author. Add Supabase/Neon only when real user accounts arrive. |
| No auth | Same reason. Don't scaffold it "ready for later". |

---

## Content model

Types live in `content/types.ts`. Taxonomy lives in `content/taxonomy.ts`.
Both are authoritative — treat them as the spec, not as sample code.

### Categories

Exactly one per recipe. Determines the URL. Defined in `CATEGORIES`.

`breakfast` · `desserts` · `appetizers` · `soups-salads-sandwiches` ·
`pasta` · `beef` · `chicken-pork` · `sides` · `misc`

**Tiebreak rule.** When a recipe fits more than one, evaluate the list in the
order above and take the first match. Chicken noodle soup → `soups`, not
`chicken-pork`. Beef lasagna → `pasta`, not `beef`.

Nav uses `short`; page headings and `<title>` use `label`. "Potatoes, Veggies
& Side Dishes" is too long for a nav item, which is why both exist.

Categories with zero recipes are hidden from the nav and get no page. An empty
landing page is thin content and a dead end.

`misc` is a holding pen. When fish or vegetarian mains accumulate three or four
recipes each, split them out into their own categories.

### Attributes

Many per recipe, or none. Filters only — never in a URL.
`vegetarian` · `weeknight` · `make-ahead` · `spicy`

### Ingredients

`item` is **not** free text. It must be a canonical name in `INGREDIENTS`.

- Aliases (`beef mince` → `ground beef`, `spring onions` → `scallions`,
  `oleo` → `butter`) map to canonical names via `ALIAS_MAP`.
- `resolveIngredient()` returns `null` when it can't resolve something. That
  null is a hard stop — surface it to the human. **Never write an unresolved
  string into a recipe file.** Near-duplicate canonical names are what
  silently destroy ingredient search.
- Adding an alias is cheap and encouraged. Adding a near-duplicate canonical
  name is the failure mode.

---

## Units and scaling

**Storage is imperial.** Volume in tsp/tbsp/cup, weight in oz/lb,
temperatures in °F. Vocabulary is American (`cilantro`, `all-purpose flour`,
`baking soda`, `cornstarch`). Allowed units are in `UNITS` — nothing else.

### Display rounding

Never print a decimal quantity. Never round an amount away to zero.

Rule: use the largest unit that yields at least one whole, **or** a unit where
the amount lands within 4% of a standard measure (¾ cup qualifies; 0.15 cup
does not). Then snap to that unit's `steps` — the fractions its real measuring
tools can actually produce. A cup set gives eighths and thirds; a tablespoon
gives halves and nothing finer.

Worked examples the implementation must satisfy:

```
0.5 cup  × 0.2  → 1½ tbsp      (not "0.1 cup")
0.75 cup × 0.2  → 2½ tbsp
1.5 cup  × 0.2  → 5 tbsp
1 tsp    × 0.2  → ¼ tsp
0.5 tsp  × 0.2  → ⅛ tsp        (floors here, never 0)
3 tbsp   × 4    → ¾ cup
3 tbsp   × 2    → 6 tbsp       (⅜ cup is not a real measure)
1 lb     × 0.5  → ½ lb
28 oz    × 0.5  → 14 oz
```

### Yield

Two kinds, and conflating them is what produced "0.1 cups of butter":

- `{ kind: "servings", serves: n }` — divisible. Stepper control, scales freely.
- `{ kind: "fixed", noun, plural, cuts?, pan? }` — indivisible. A loaf "serves
  10" because it cuts into 10 slices, not because it divides into 10 portions.
  You cannot bake a fifth of a loaf; the pan is the real constraint.
  Whole-multiple control only (×1 ×2 ×3), and state the pan.

Most baked goods are `fixed`. Everything else is `servings`.

### Non-linear ingredients

`scaling: "leavening"` (baking soda/powder/yeast) and `scaling: "taste"`
(salt, spices, extracts).

Quantities still scale **linearly** in the arithmetic. These tags only trigger
a footnote beneath the ingredient list when the scale factor isn't 1. Never
silently alter a number the cook didn't ask to change — a site that quietly
adjusts your baking soda is one you stop trusting.

Count-unit ingredients that scale to a fraction get their own footnote
(round, or beat and weigh — a large egg is roughly 50 g).

### Gram weights

Optional `g` field, per ingredient, for the authored quantity. Fill in for dry
baking ingredients only; skip it everywhere else. Scales with the recipe,
displayed rounded to the nearest 5 g. **An importer must never guess this** —
a cup of flour varies by 20% depending on how it's scooped.

---

## Design system

Dark, cool ground so food photography carries all the color. Deliberately not
the cream-paper-and-serif food blog look.

```
--ink       #15181D   page
--surface   #1D222A   raised
--surface-2 #262D37   hover
--line      #323A46   borders
--chalk     #EDEAE4   primary text
--muted     #939DAB   secondary text
--zest      #F5D547   accent — active states only, used sparingly
```

Type: **Bricolage Grotesque** (700/800) for headings and the wordmark,
**Instrument Sans** (400/500/600) for body and UI. Body 17px, steps 17.5px —
large enough to read at arm's length across a counter.

Wordmark: "Dumas" at 800 in chalk, "Family Recipes" at 500 in muted. No color
accent on the wordmark; `--zest` is reserved for active state.

Quality floor: responsive to mobile, visible keyboard focus, reduced motion
respected. Ad slots are reserved in the layout now (leaderboard between grid
rows, 300×250 in the recipe sidebar) so adding AdSense later doesn't break
the design.

---

## URLs and SEO

```
/                              homepage — search + grid
/recipes/<slug>                recipe (slug is permanent — it's the URL)
/<category-slug>               category landing page
```

Non-negotiable for a site that will carry ads:

- schema.org `Recipe` JSON-LD on every recipe page. This produces the rich
  result with photo, time and rating, and it's the difference between a hobby
  site and one that earns.
- `generateMetadata` per page. Visible `<h1>` on the homepage is "What are you
  cooking?" — good interface copy, useless as a search signal. The `<title>`
  must carry the real nouns: "Dumas Family Recipes".
- Unique intro copy per category page (already in `CATEGORIES[].blurb`).
  Nine near-identical landing pages read as duplicates to a crawler.
- `sitemap.xml` and an RSS feed.

On importing from other sites: ingredient lists and procedures aren't
copyrightable, but headnotes, stories and photographs are. The `blurb` must
always be original writing and the photo must be ours. This is also the SEO
answer — Google's helpful-content systems target recipe pages that restate
what's already indexed.

---

## Decisions already made — don't re-propose these

- **No pantry / "ingredients I have" tracking.** Built, then deliberately
  removed. Search by name and by ingredient is all that's wanted.
- **No Figma.** The design lives in code.
- **No MDX.** JSON, for importer safety.
- **Search suggestions appear only while typing**, never on focus, and exclude
  exact matches. The panel is a spelling aid, not a browse surface.
- **No auth, no database, no CMS** until there are real user accounts.

---

## Build order

1. ⬜ Scaffold Next.js, wire taxonomy + validator, `npm run validate` green
2. ⬜ All 10 recipes as JSON, validator still green
3. ⬜ Port components from the prototype; homepage, category pages, recipe pages
4. ⬜ JSON-LD, metadata, sitemap, RSS
5. ⬜ Deploy to Vercel
6. ⬜ Recipe import skill (PDF / docx / URL)

The import skill goes **last**, so it can read the real taxonomy and run the
real validator.

## Commands

```bash
npm run dev        # local
npm run validate   # recipe vocabulary + schema check
npm run build      # runs validate first via prebuild
```
