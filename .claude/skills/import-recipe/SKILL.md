---
name: import-recipe
description: >-
  Import a recipe into this site from a PDF, a photo of a recipe card, a
  .docx file, or a URL, producing a validated content/recipes/<slug>.json
  file. Use this whenever the user asks to import, add, or convert a recipe
  from any of those sources — including phrasing like "add this recipe",
  "grab this recipe from this link", "here's a recipe card, can you add
  it", or "turn this PDF/Word doc into a recipe" — even if they don't say
  the word "import." Do not hand-write a recipe JSON file from a source
  document without going through this skill: the ingredient-resolution and
  unit-conversion steps here are exactly the steps that keep the site's
  taxonomy from rotting.
---

# Importing a recipe

This site stores every recipe as JSON validated against `content/taxonomy.ts`
(the vocabulary) and `content/types.ts` (the shape). Read both before you
start if you haven't already this session — they're short, and this skill
assumes you know what `resolveIngredient()`, `UNITS[].steps`, and the two
`Yield` kinds mean rather than re-explaining them inline.

The reason this skill exists at all: an importer's failure mode is silent.
Nothing crashes when it writes "scallions" one week and "green onions" the
next as two different canonical ingredients — the ingredient search just
gets quietly worse until nobody trusts it. Every rule below is either
preventing that specific failure or converting units without guessing.

## Stop and ask — don't improvise past these

Work through the whole recipe and collect every open question before
interrupting once, rather than stopping on the first one. But do stop for:

- **Any ingredient or unit that `resolve.ts` (see below) resolves to
  `null`.** This is nonnegotiable. Never invent a canonical name, never pick
  the closest-looking existing one yourself — ask the user whether it's a
  new alias for an existing canonical ingredient, or a genuinely new
  canonical ingredient that belongs in `content/taxonomy.ts`. A near-duplicate
  canonical name (e.g. adding "spring onion" as canonical when "scallions"
  already exists) is worse than stopping to ask, because nothing will ever
  flag it again.
- **The source gives only one time figure** (e.g. "Total: 45 min" with no
  prep/cook split). Don't invent an `active`/`total` split — ask, or ask
  whether a rough estimate from reading the steps is good enough.
- **The category isn't a clean top-to-bottom match** — state your reasoning
  and your pick, and ask if it's a close call (e.g. a soup with a lot of
  chicken in it). You don't need to ask when the tiebreak rule in
  `content/taxonomy.ts` resolves it cleanly (see Step 5).
- **JSON-LD is present but missing fields you need** (no ingredients, no
  instructions) — don't silently fall back to scraping the visible page for
  just the missing piece and mixing sources; tell the user what's missing.
- **OCR from a photo is low-confidence** on a quantity or ingredient name —
  garbled handwriting, a smudge, a number you're genuinely guessing at. Ask
  rather than pick the most plausible reading silently. A wrong ingredient
  *name* is a taxonomy problem forever; a wrong ingredient *quantity* just
  ruins one recipe.

Everything else below is mechanical enough not to need sign-off.

## Step 1 — Get raw text out of the source

**PDF:** Read it directly with the Read tool (it handles PDFs natively,
paginate with the `pages` param if it's long).

**Photo of a recipe card:** Read it directly with the Read tool — you can
read images. Transcribe carefully; recipe cards are often handwritten or
low-contrast scans. If you're genuinely unsure about a word or number, that's
a stop-and-ask case above, not a guess.

**`.docx`:** The Read tool doesn't handle Word documents. Try, in order:

```bash
pandoc "$FILE" -t plain
```

If `pandoc` isn't installed, fall back to unzipping the document part and
stripping markup (a `.docx` is a zip of XML):

```bash
unzip -p "$FILE" word/document.xml | python3 -c "
import sys, re
xml = sys.stdin.read()
text = re.sub(r'<[^>]+>', ' ', xml)
text = re.sub(r'[ \t]+', ' ', text)
print(text)
"
```

This produces rougher output (no paragraph breaks) but is dependency-free.

**URL — read this part carefully, order matters:**

1. Fetch the **raw HTML** first, before anything else:
   ```bash
   curl -sL "$URL"
   ```
   Do this before reaching for a web-fetch/summarization tool. Those tools
   are built to hand you readable page content, which typically means they
   strip `<script>` tags — exactly where the structured data you want lives.
   Fetching raw HTML is the only reliable way to see it.
2. Search the raw HTML for `<script type="application/ld+json">` blocks and
   parse each one as JSON. A recipe site's structured data can be shaped
   several ways — check all of them:
   - a single object with `"@type": "Recipe"`
   - an array of objects, one of which has that type
   - a `"@type"` that's itself an array (e.g. `["Recipe", "NewsArticle"]`)
   - nested under `"@graph": [...]`
3. **If you find a valid Recipe object, it is authoritative. Do not also
   scrape the visible page prose for the same fields** — use `name`,
   `recipeIngredient`, `recipeInstructions`, `prepTime`/`cookTime`/`totalTime`
   (ISO 8601 durations like `PT1H10M` — parse with something like
   `PT(?:(\d+)H)?(?:(\d+)M)?`, converting to total minutes), `recipeYield`,
   and `author`. This is both less work and more accurate than prose parsing:
   it's the same data Google itself reads for rich results.
   - `recipeInstructions` may be an array of strings, or of `HowToStep`
     objects (use their `text`), or occasionally of `HowToSection` objects
     containing nested steps — flatten accordingly.
4. Only if no usable Recipe JSON-LD exists, fall back to reading the page's
   visible content (a web-fetch tool is fine for this part — you already did
   the JSON-LD check on raw HTML, so losing script tags here doesn't matter)
   and parse the prose the way you would a PDF or photo.

## Step 2 — Draft the recipe in your head before converting anything

Read the whole source once. Note: title, every ingredient line verbatim,
every step verbatim, any stated yield/servings, any stated timing, and
whether the source's units are metric, imperial, or mixed. Don't start
writing the JSON yet — get the full picture first, since some decisions
(category, yield kind) are easier once you've read the steps, not just the
ingredient list.

## Step 3 — Convert units before resolving anything

Convert *before* you check anything against the taxonomy, because
`resolveUnit()` only knows the site's own imperial unit names — it will
correctly return `null` for `"g"` or `"ml"`, and that's not a stop-and-ask
case, that's just you not having converted yet.

**Temperature — exact:** `F = C × 9/5 + 32`. Convert every oven temperature
and any temperature mentioned in step text, not just a structured field.

**Weight → weight — exact, no guessing:** `oz = g ÷ 28.3495` (`lb = oz ÷ 16`
for anything over ~12 oz). Use this for anything sold and measured by
weight regardless of what it is — meat, cheese, canned goods. Round to a
sensible fraction (quarters, per `UNITS` in `content/taxonomy.ts`) rather
than a raw decimal.

**Volume → volume — exact, no guessing:** `tsp = ml ÷ 4.92892`,
`tbsp = ml ÷ 14.7868`, `cup = ml ÷ 236.588`. Pick whichever of tsp/tbsp/cup
gives the cleanest number, the same way the site's own `display()` in
`lib/quantity.ts` picks the largest unit that lands near a whole number.

**Weight → volume for dry baking ingredients — an estimate, and the one
place gram figures are worth keeping.** A metric recipe often gives flour,
sugar, etc. by weight because it's more precise than volume — converting it
*to* a cup measurement is inherently approximate (this is exactly the
guess-preventing rule behind the optional `g` field: "a cup of flour varies
by 20% depending on how it's scooped"). Use standard published baking
conversions (roughly: all-purpose flour ≈ 120 g/cup, granulated sugar ≈
200 g/cup, brown sugar ≈ 220 g/cup packed, butter ≈ 227 g/cup, cornstarch ≈
120 g/cup — a quick web search for "<ingredient> grams per cup" is fine if
you're unsure) to get a `qty`/`unit`, round that to the nearest fraction in
the target unit's `steps` array, **and then set the optional `g` field to
the source's actual gram figure.** This is the one case where filling in
`g` on import is legitimate rather than guessed: the number came from the
source, not backward from a cup measurement. If a source already gives both
("1 cup / 120g flour"), even easier — use the stated cup measurement as-is
and the stated grams for `g`, no conversion needed at all.

**Count items** ("2 onions", "3 eggs") need no conversion.

**Rounding, in general:** never leave an ingredient at a raw decimal like
`0.234`. Open `content/taxonomy.ts` and check the `steps` array for the unit
you landed on — round to the nearest value there (this is the same snapping
`snapIn()` in `lib/quantity.ts` does at display time; you're just doing it
once, by hand, at authoring time).

Convert metric mentions inside step *text* too (oven temps, "add 200ml
stock"), not only structured ingredient quantities — the validator checks
step text for stray `°C` and metric units and will fail on them.

## Step 4 — Resolve every ingredient and unit mechanically

Never eyeball-match a raw string against `INGREDIENTS` or `UNITS` yourself —
run it through the site's actual `resolveIngredient()`/`resolveUnit()`
functions via the bundled script, so the check is exactly the one the
validator will also run:

```bash
echo '{"ingredients":["beef mince","smoked paprika"],"units":["cup","tbsp"]}' \
  | npx tsx .claude/skills/import-recipe/scripts/resolve.ts
```

Batch every ingredient name and every (already-converted) unit from the
recipe into one call. The script prints each raw string next to what it
resolved to, `null` if it couldn't. `allResolved: false` and a nonzero exit
code mean at least one didn't resolve — that's the first stop condition
above: ask the user rather than proceeding, and don't write the recipe file
until every ingredient and unit comes back non-null.

If the user tells you to add a new alias or canonical ingredient, edit
`content/taxonomy.ts` yourself (an alias is a one-line addition to an
existing entry's `aliases` array; a genuinely new canonical ingredient is a
new entry in `INGREDIENTS`), then re-run the script to confirm it resolves.

## Step 5 — Classify

**Category:** walk `CATEGORIES` in `content/taxonomy.ts` top to bottom and
take the first one the recipe fits — this tiebreak rule is what keeps
chicken noodle soup in `soups-salads-sandwiches` and beef lasagna in
`pasta` rather than `chicken-pork`/`beef`. State which category you picked
and why in your final summary even when it's obvious.

**Attrs:** only add one when the recipe clearly earns it — don't guess
liberally. `vegetarian` needs no meat/fish/gelatin anywhere in the
ingredients. `weeknight` fits a genuinely fast, low-effort recipe (rough
guide: total time under 40–45 minutes and nothing exotic). `make-ahead` only
when the source itself says so or the dish is obviously better rested
(stews, marinated things). `spicy` needs an actual chili/heat ingredient,
not just "a pinch of pepper." No attrs at all is a completely normal,
common outcome — don't force one on.

**Yield kind:** `servings` (divisible, most recipes) vs `fixed` (indivisible
— a loaf serves 10 because it *cuts into* 10 slices, not because a fifth of
a loaf is bakeable). Most baked goods are `fixed`; state the pan size if the
source gives one, since a doubled batch needs to know it wants two pans.

## Step 6 — Write your own blurb

Never copy or lightly paraphrase the source's headnote — copyright aside,
the validator can't catch derivative prose and this is exactly the thing
Google's helpful-content systems penalize ("restates what's already
indexed"). Read a few existing files in `content/recipes/` for voice: terse,
one or two sentences, usually surfacing one specific technique or detail
that matters, not generic praise ("delicious!", "a family favorite!").
Aim for 100–250 characters — the validator only warns under 40, but shorter
reads thin. Same principle for the recipe photo: `image` must stay unset for
an import — never point it at a scraped source image URL. Mention in your
final summary that a real photo still needs to be added.

## Step 7 — Assemble the file

Shape it exactly like `content/types.ts`'s `Recipe` interface — the existing
files in `content/recipes/` are the clearest reference. A few fields worth
being deliberate about:

- **`slug`**: kebab-case of the title, must exactly equal the filename.
  Check `content/recipes/` for a collision before you commit to one.
- **`source`**: honestly reflect where this came from —
  `{ kind: "url", ref: "<the URL>", credit: "<site or author, if known>" }`,
  `{ kind: "file", ref: "<a short description, e.g. original filename>" }`
  for a PDF/docx, or `{ kind: "card", ref: "<whose card, if known>" }` for a
  photographed recipe card. `kind: "original"` is for the user's own
  recipes, not imports.
- **`added`**: today's date — run `date +%F` rather than assuming you know
  it.
- **`tint`**: optional and purely cosmetic (a two-color gradient hinting at
  the dish's color). Pick something plausible in the mood of existing
  recipes' tints, or leave it unset — this is never worth stopping to ask
  about.
- **`scaling`**: tag `"leavening"` for baking soda/powder/yeast and
  `"taste"` for salt/spices/extracts, same as existing recipes — the
  validator will warn if you miss one, but it's better to get it right the
  first time.

## Step 8 — Validate, and don't stop until it's green

```bash
npm run validate
```

Fix every error it reports (it won't let you stop with errors present —
`npm run build` would fail too). Take its warnings seriously as well: a
missed `scaling` tag, a suspiciously round oz/cup number that looks like an
unconverted metric value, an unused-ingredient warning suggesting you wrote
a near-duplicate instead of reusing an existing canonical name — that last
one especially is worth double-checking against Step 4 rather than
dismissing.

## Step 9 — Summarize for the user

Before finishing, tell the user: the category you chose and why, any attrs
you added and why, every unit conversion you made (flag the estimated
weight→volume ones specifically, since those are the ones with real
uncertainty), and that the photo still needs to be added by hand. This is
the human's chance to catch something before it sits in the repo.
