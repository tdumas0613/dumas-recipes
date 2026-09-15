# Prompt for Claude Code — restyle Dumas Family Recipes to "Pressed"

Paste everything below into Claude Code from the repo root.

---

We are replacing the current dark/zest visual design with an approved new direction called **Pressed**. This is a restyle, not a re-architecture. Do not change the content model, taxonomy, scaling logic, routing, or the component tree beyond what the new styles require.

Read `CLAUDE.md` first. Two things in it are now out of date and you should update them as part of this work:

- The **Design system** section (dark ground, `--zest`, Bricolage Grotesque / Instrument Sans) is superseded by the palette and type below.
- The wordmark rule is superseded: the mark is now the seal plus "Dumas Family Recipes" set in Newsreader.

Everything else in `CLAUDE.md` still stands — especially "no Tailwind, plain CSS with one global stylesheet and CSS vars".

## Palette

Replace the `.rx` custom properties in `app/globals.css` with:

```css
--paper:      #F5F1E8;  /* page ground */
--surface:    #FFFDF8;  /* inputs, dropdown panels */
--rule:       #DED7C7;  /* section rules, borders */
--hairline:   #EAE4D6;  /* ingredient row dividers */
--ink:        #22201C;  /* primary text */
--muted:      #6E6A60;  /* secondary text */
--olive:      #4E5B3A;  /* masthead + every selected state */
--olive-dark: #3F4A2E;  /* borders inside the olive band */
--clay:       #A65A3A;  /* editorial markers only */
```

Rules for the two accents, and these are the whole point of the direction:

- **Olive is the only interactive colour.** Masthead band, selected category, active attribute filter, focused search field, highlighted search result, step numerals, ingredient quantities, the empty-state button. It is used as a **solid fill with `--paper` text**, not as a tint or a text colour on the selected state.
- **Clay is never a state.** It marks editorial labels at small caps scale only: "Newest", "From the family", "Serve with", and the search field's "clear". Never a button, link, or selection.
- Reversed text on olive is `--paper`, never `#fff`.

## Type

Swap the Google Fonts import to:

```
Newsreader (400, 500, and 400 italic) — headings, recipe titles, card titles,
  standfirsts, method step text, pull quotes
Jost (400, 500, 600) — nav, filters, metadata, ingredient quantities,
  buttons, all uppercase labels
```

Body/UI base 15px Jost; method steps 18.5px Newsreader at line-height 1.6. Display sizes get `letter-spacing:-.02em`. Uppercase labels get `letter-spacing:.14em` at 11px and `.1em` at 12.5px.

## Shape and spacing

- Border radius **2px** everywhere. The only exception is the step numeral, a 34px olive circle with a paper numeral in Newsreader.
- Remove all box-shadows except one: the search suggestion panel keeps `0 14px 30px rgba(40,36,28,.1)`.
- Remove the radial-gradient sheens on `.shot` and `.dshot`. Images get a flat `1px solid var(--rule)` border and no radius.
- Page gutter 46px at `.wrap` (20px below 860px). Card grid gap 28px.
- Recipe hero image crop changes from **21:9 to 4:5** and moves beside the title in a `1fr 360px` grid, not above it. Grid cards stay 4:3.

## Screen-by-screen

**Masthead (`.mast`)** — now a full-bleed olive band, paper text, seal at 46px on the left, wordmark in Newsreader 23px with the recipe count in uppercase Jost 11px beneath it. The search field sits inside the band on `--surface` with an `--olive-dark` border.

**Nav (`.nav` / `.navlink`)** — sits on paper below the band. Selected item is a solid olive chip (`padding:5px 12px`, paper text, 600) instead of the current underline. Unselected items are `--muted` with the same padding so nothing shifts.

**Attribute filters (`.attrs` / `.attr`)** — outlined chips, 1px `--rule`, muted text. Active chip is solid olive with paper text.

**Cards (`.card`)** — Newsreader 500 22px title; meta line puts the category in olive 500 uppercase and the rest (`· 40 min · Serves 4`) in muted.

**Recipe detail** — the category becomes a solid olive badge above the title. Step numerals become olive circles. Ingredient quantities stay olive 600 tabular-nums. The serving scaler gets an olive border and olive glyphs. "Serve with" label is clay; the links beneath it are ink with a 1px olive underline.

**Search** — open field gets a 2px olive border. The highlighted suggestion row is a solid olive fill with paper text (currently a subtle surface tint). Section headers in the panel stay muted uppercase.

**Empty state** — "Back to all N recipes" becomes a solid olive button with paper text.

**Ad slots** — keep both reserved slots exactly where they are. Change the dashed border to a solid 1px `--rule` top and bottom with no side borders, muted 11px monospace label.

## The seal

Four SVGs ship with this brief. Copy them to `public/brand/`:

```
seal.svg                 full seal, ink #22201C — light grounds
seal-reversed.svg        full seal, paper #F5F1E8 — the olive masthead band
seal-mark.svg            compact ring + D, ink — below 40px
seal-mark-reversed.svg   compact ring + D, paper
```

Use `seal-reversed.svg` at 46px in the masthead and 30px on the recipe page header. Use `seal-mark.svg` for the favicon and any use under 40px. The SVGs set type in Newsreader and Jost via an @import inside the file, so they render correctly when loaded as `<img>` in a browser; if you ever need them in a context without webfonts (email, a raster export), outline the text in a vector editor first rather than substituting a fallback font.

The DUMAS band knocks through the centre D — where the bar crosses the letter, the seal is transparent and the ground shows through. That is why the reversed file must sit on a flat olive band and never on a photograph or a gradient.

Do not recolour the seal or recreate it inline in JSX — reference the files.

## Files you will touch

- `app/globals.css` — the bulk of the work
- `app/layout.tsx` — font links
- `components/RecipeBrowser.tsx`, `Card.tsx`, `SearchField.tsx`, `RecipeDetail.tsx` — only where markup must change (the masthead band wrapper, the category badge, the hero grid, the step numeral element)
- `components/Shot.tsx` — drop the gradient sheen, add the flat border
- `public/brand/` — new, holds the four seal SVGs
- `app/favicon.ico` — regenerate from `seal-mark.svg`
- `CLAUDE.md` — rewrite the Design system section to match this

## Quality floor, unchanged

Responsive to mobile, visible keyboard focus (2px olive, offset 3px), reduced motion respected, ad slots reserved, `npm run validate` and `npm run build` green.

## Working method

Do `app/globals.css` first and get the homepage right before touching the recipe page. Show me the homepage diff before you move on. Do not introduce a CSS framework, do not convert plain CSS to modules, and do not refactor components that only need new class styling.
