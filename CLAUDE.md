# Dumas Family Recipes

A personal recipe site. Single author for now; user accounts are deliberately
**not** being built yet. Display ads aren't built yet either — but they're the
point, which is what the next section is about.

This file is the record of decisions already made. Read it before proposing
changes to architecture, schema, or vocabulary.

---

## The site is meant to earn

Ad revenue is the goal the rest of these decisions serve. No AdSense account
and no ad code exist yet, so nothing here is asking for an integration — but
when two approaches are otherwise equal, the one that earns more wins, and an
approach that forecloses earning loses even when it's tidier.

What that actually means when writing code here:

- **Pageviews are the unit.** Revenue is impressions × rate, so the work that
  earns is the work that brings people in and then gives them a second page
  worth opening — statically rendered HTML, rich results, links between
  related recipes. The URLs and SEO section below isn't hygiene; it's the
  revenue mechanism, which is why those items are called non-negotiable.
- **Never ship a layout with nowhere to put an ad.** The reserved slots in the
  design system are load-bearing, not decoration. A redesign that fills the
  page edge to edge is a redesign that has to be done twice.
- **Reserve the space; don't let it collapse.** A slot holds its height
  whether or not an ad fills it. An ad that pushes content down on arrival is
  a layout shift, and Core Web Vitals feed back into the ranking that produced
  the visit in the first place.
- **The quality floor is part of the strategy, not a tax on it.** Original
  writing, our own photography, the recipe near the top of the page, no
  interstitials. Google's helpful-content systems and AdSense's own policies
  both punish the alternative, so burying the page in ad density isn't a
  trade of experience for revenue — it's how you lose the traffic that was
  the revenue.

---

## Stack — settled, do not substitute

| Choice | Reason |
| --- | --- |
| Next.js, App Router | Recipe traffic comes from Google. A client-rendered SPA serves crawlers an empty div and never ranks. Recipe pages must be statically rendered HTML. |
| TypeScript | The taxonomy is only useful if it's type-enforced. |
| Plain CSS (one global stylesheet + CSS vars) | The prototype is written this way. No Tailwind. |
| Recipes as JSON in `content/recipes/` | An importer writes these far more often than a human edits them. JSON is safe to machine-write and trivial to validate. |
| Vercel | Deploys from git, no ops. |
| No database | Git already provides accounts, permissions and history for one author. Add Supabase/Neon only when real user accounts arrive. |
| No auth | Same reason. Don't scaffold it "ready for later". |

---

## Content model

Types live in `content/types.ts`. Taxonomy lives in `content/taxonomy.ts`.
Both are authoritative — treat them as the spec, not as sample code. The
category and attribute lists are defined there; don't restate them here.

### Categories

Exactly one per recipe. Determines the URL. Defined in `CATEGORIES`.

**Tiebreak rule.** When a recipe fits more than one, evaluate `CATEGORIES` in
declaration order and take the first match. Chicken noodle soup →
`soups-salads-sandwiches`, not `chicken-pork`. Beef lasagna → `pasta`, not
`beef`.

Nav uses `short`; page headings and `<title>` use `label`. "Potatoes, Veggies
& Side Dishes" is too long for a nav item, which is why both exist.

Categories with zero recipes are hidden from the nav and get no page. An empty
landing page is thin content and a dead end.

`misc` is a holding pen. When fish or vegetarian mains accumulate three or four
recipes each, split them out into their own categories.

### Attributes

Many per recipe, or none. Filters only — never in a URL.

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
- **One row per ingredient.** An item appears once, carrying the total; a
  recipe using olive oil in three components still lists it once, noted
  `divided`. The split belongs in the step text, since only `qty` scales.

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

Worked examples `lib/quantity.ts` must satisfy — there is no test suite, so
these are the spec:

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

## Design system — "Pressed"

A printed cookbook, not a food blog: warm paper ground, one serif for voice,
one grotesque for machinery, and a single olive that means *this is the thing
you selected*. `app/globals.css` is authoritative for the palette and the type
scale — read the values there, don't restate them here.

Rules that outlive the values:

- **Olive is the only interactive colour.** Masthead band, selected category,
  active filter, focused search field, highlighted suggestion, step numerals,
  ingredient quantities, the empty-state button. Always a solid fill with
  `--paper` text — never a tint, never olive text as the selected state.
  Reversed text on olive is `--paper`, never `#fff`.
- **Clay is never a state.** It marks editorial labels at small-caps scale and
  nothing else — "Newest" and "From the family" on the homepage, the search
  field's "clear". Never a button, a link, or a selection. The `.elabel` class
  is the only place it belongs. ("Serve with" is in the design but not built:
  related recipes need a field that doesn't exist yet.)
- **Radius is 2px everywhere.** The one exception is the step numeral, a 34px
  olive circle. No shadows except the search suggestion panel's single soft
  drop. No gradients.
- The wordmark is the seal plus "Dumas Family Recipes" set in Newsreader.
  Headings, recipe titles and method steps are Newsreader; nav, filters,
  metadata, quantities and every uppercase label are Jost. Body type is sized
  to read at arm's length across a counter; don't shrink it.
- **The seal lives in `public/brand/`, four files** — full seal and compact
  mark, each in ink and in paper. Those four files are the artwork's source of
  truth; there is no un-embedded original anywhere.
  - Full seal at 40px and up, compact mark below (favicon, app icon, inline
    byline). Minimum full seal 40px, minimum mark 16px. Clear space on all
    sides is the width of the D.
  - Reference the files; never rebuild it inline in JSX. Never recolour
    beyond ink and paper, never stretch the ring, never reset the ring text,
    and never place it on a photograph or a gradient — the DUMAS band knocks
    through the centre D, so the ground shows through and it only reads on a
    flat colour.
  - Each file carries its own Newsreader and Jost, subsetted, as a data URI.
    An SVG loaded through `<img>` is an isolated document that cannot fetch a
    webfont, so a file that merely names the families falls back to Times for
    the D and DUMAS and to a system sans for the ring text. After editing the
    artwork run `python3 scripts/embed-seal-fonts.py`; `--check` verifies
    without writing. The subsets stay variable on purpose — Newsreader's opsz
    axis serves both the 128px D and the 27px DUMAS in one file.
  - `app/favicon.ico` is rasterised from `seal-mark.svg` at 16/32/48;
    regenerate it if the mark changes.
- Photography is ours, two crops: 4:3 for grid cards, 4:5 for the recipe hero
  (the crop that travels to Pinterest). Flat `1px solid var(--rule)` border,
  no radius, no overlay. A recipe with no photo yet gets the hatched
  placeholder and ships — a missing photo beats a stock one. `Shot.tsx` is
  the seam a real `<img>` drops into without the layout moving. Daylight, one
  light direction, plates and boards rather than styling props.
- **Nav carries no per-category counts.** Ten of them overflow the row at
  every width. The total is in the masthead and the category's own count is
  in its hero.

Quality floor: responsive to mobile, visible keyboard focus (2px olive, offset
3px), reduced motion respected. Ad slots are reserved in the layout
(leaderboard between grid rows, 300×250 in the recipe sidebar) and hold their
height whether or not an ad fills them, so adding AdSense later neither breaks
the design nor introduces a layout shift.

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
- Unique intro copy per category page (`CATEGORIES[].blurb`). Nine
  near-identical landing pages read as duplicates to a crawler.
- Keep `sitemap.xml` and the RSS feed current.

### Voice

Plain, specific, slightly dry. State the trick and why it works. No exclamation
marks, no "delicious", no origin stories that exist to fill space. Headnotes
(`blurb`) are two sentences. Method steps tell the cook what to look for, not
just what to do: *the skin should be deep amber and release without sticking —
if it sticks, it isn't ready.*

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

## Commands

```bash
npm run dev        # local
npm run validate   # recipe vocabulary + schema check
npm run build      # runs validate first via prebuild
```
