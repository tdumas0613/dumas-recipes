# Traffic Strategy Brief — Dumas Family Recipes

Context for a codebase review. The site currently has **~39 recipes**. Goal:
identify what in the traffic strategy below is already implemented, what's
missing, and what's worth building next — specifically by reading the actual
code rather than assuming from this brief.

This is about **acquisition** (new visitors finding the site) as distinct from
retention or engagement features. Login, accounts, and favoriting were
evaluated separately and explicitly ruled out for now — they help returning
visitors, not new ones, and add infrastructure (auth, database) the site
doesn't otherwise need. Don't propose them here.

---

## Why traffic is downstream of SEO fundamentals for this site

Ad revenue requires real pageviews, and for a recipe site those pageviews come
overwhelmingly from two sources: Google search and Pinterest. Both reward the
same underlying things — structured, crawlable, original content at real
volume — rather than any single clever feature. The priority order below
reflects that: fix foundational SEO first, then content strategy, then
distribution channels like Pinterest and email.

## 1. Search fundamentals (highest leverage, check this first)

- **schema.org `Recipe` JSON-LD on every recipe page.** This is what produces
  rich results — photo, star rating, cook time — directly in search results,
  which drives click-through far more than a plain listing. Check whether
  this was actually implemented per-recipe and whether it validates (Google's
  Rich Results Test).
- **Real `generateMetadata`/title tags per page**, distinct from the visible
  `<h1>`. The homepage `<h1>` is conversational ("What are you cooking?") by
  design — the `<title>` needs to carry actual search terms instead
  ("Dumas Family Recipes" plus relevant nouns).
- **Unique intro copy on every category landing page.** Nine near-identical
  category pages read as duplicate content to a crawler. Check that each of
  the 9 categories has genuinely distinct blurb text, not boilerplate.
- **Internal linking between related recipes** ("serve with X"). Keeps
  visitors on-site longer and helps Google understand site structure. Check
  whether recipe pages currently link to any other recipes at all.
- **`sitemap.xml` and RSS feed**, both live and correctly generated.
- **Recipe titles matching actual search phrases**, not cute names. E.g.
  "Brown butter banana bread" over a story-title. Worth an editorial pass
  across all 39, not a code change — flag it, don't fix it silently.

## 2. Content strategy

- **Seasonal timing compounds for years.** A holiday-adjacent recipe (e.g. a
  Thanksgiving side) published a couple months ahead ranks in time for the
  season and then resurges automatically every year after with no further
  work. Check the `added` date field and categories for gaps against upcoming
  seasonal windows — this is a content-planning suggestion, not code.
- **Publish on a steady cadence** rather than in bursts — signals an active
  site to Google and gives returning visitors a reason to check back.
- **Answer real search questions directly** — e.g. "can I freeze banana
  bread?" as an explicit FAQ block on that recipe, since people search that
  exact phrase. Possible schema: an optional `faq` field per recipe, rendered
  with FAQPage JSON-LD alongside the Recipe schema.
- **Update older recipes**, not just publish new ones — freshness is a
  ranking signal. Not a code task, but the `added` field could support
  surfacing "recently updated" if a `updated` field were added.

## 3. Pinterest (disproportionately important for recipe content)

Recipe content is one of the few categories where Pinterest can rival Google
for referral traffic, and pins stay discoverable for years.

- **Vertical pin images** (~1000×1500px) with the recipe name overlaid as
  text — this out-performs plain food photography on Pinterest specifically.
  Check whether the image pipeline produces or could produce a
  Pinterest-optimized variant per recipe, distinct from the hero image used
  on-page.
- **A visible "Pin it" affordance** on the recipe hero image/photo. Check
  whether one exists; if not, this is a straightforward addition once real
  photos replace the current placeholder gradients.
- Both of these are blocked on the site having real recipe photography rather
  than the gradient placeholders currently in use — flag that dependency if
  it's still the case.

## 4. Email

- A simple "new recipe" notification list is a return-traffic channel that
  doesn't depend on any algorithm (Google or Pinterest). Worth a lightweight
  signup — this doesn't require the account/auth system that was ruled out;
  an email list is just an address, not a login.

## 5. Explicitly out of scope for this review

- User accounts / login
- Favoriting or saved-recipe features
- Anything that primarily serves returning, already-engaged visitors rather
  than bringing in new ones

If browser-only (`localStorage`, no account) favoriting already exists or is
trivial given the current architecture, it's fine to note, but it should not
be framed as a traffic strategy.

---

## What to actually do with this

1. Grep/read the codebase against each item in sections 1–4.
2. For each item, report: **implemented**, **partially implemented**, or
   **missing** — with the specific file/location if implemented.
3. For anything missing or partial, propose a concrete next step scoped to
   this codebase (e.g. "add `updated` field to `content/types.ts` and surface
   a 'recently updated' sort on the homepage") rather than a generic
   suggestion.
4. Prioritize by leverage: search fundamentals (section 1) before content
   strategy (section 2) before Pinterest (section 3) before email (section 4),
   since each depends on the one before it actually working.
