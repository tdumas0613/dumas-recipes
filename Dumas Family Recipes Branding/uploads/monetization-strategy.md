# Monetization — Dumas Family Recipes

Context for any Claude session working on this project. This covers what the
monetization plan is, what's been deliberately ruled out, and why — so it
doesn't get re-proposed from scratch each time. Pair with `CLAUDE.md` (build
decisions) and `traffic-strategy-brief.md` (traffic tactics).

---

## The plan: display advertising

**Chosen approach.** Google AdSense, placed once the site has real content
volume and traffic history. Revenue is CPM/CPC-based — advertisers bid in a
real-time auction per pageview, the network takes roughly a third, the site
gets the rest. RPM (revenue per 1,000 pageviews) is the number that matters;
realistic range for food content is **$2–15**, meaning meaningful revenue
requires meaningful traffic, not a clever placement.

**The dependency chain this implies:**

```
ad revenue  ←  pageviews  ←  search/Pinterest traffic  ←  SEO fundamentals + content volume
```

Nothing about the ad mechanism itself is a lever. The lever is everything
upstream of it — which is why most of the actual work has gone into schema
markup, static rendering, category structure, and content volume rather than
into the ad integration itself. See `traffic-strategy-brief.md` for the
channel-by-channel breakdown (search, Pinterest, email, content cadence).

**Practical constraints already factored in:**

- AdSense approval generally wants an established site with real content and
  some traffic history before approving — this is part of why build order
  prioritized reaching 30+ recipes before ad integration.
- Ad slots are reserved in the layout now (leaderboard between grid rows,
  300×250 in the recipe sidebar — see `CLAUDE.md`) so adding AdSense later
  doesn't require a redesign.

---

## Explicitly evaluated and rejected

### Favoriting / saved recipes

**Verdict: not a monetization or traffic lever.** Ad revenue depends on new
visitors arriving via search or Pinterest. Favoriting only matters to a
visitor already on the site — it isn't crawled, pinned, or shared, so it has
no effect on acquisition. At best it's a retention nicety for people who
already visit regularly, and even that effect is weak compared to an email
list or being externally bookmarked/pinned.

If personal bookmarking is wanted, `localStorage`-based favoriting (no
account, browser-only) gets most of the practical benefit with none of the
infrastructure cost below. That's a UX nicety, not a strategy — don't frame
it as one.

### User accounts / login

**Verdict: rejected for now, and rejected as a traffic driver specifically.**
Accounts serve retention at best; they do nothing for acquisition, which is
what ad revenue depends on. They also reverse an explicit architectural
decision (`CLAUDE.md`: no auth, no database, no CMS) made because a single-author
static site doesn't need any of it. Don't propose accounts as a way to
"increase engagement" without first checking whether the goal is actually
traffic (in which case accounts are the wrong tool) or something else.

### Paid "My Cookbook" — user-uploaded recipe storage

**Verdict: a real, viable idea, but a different business, not a feature.**
Considered as a second monetization path: charge users to store their own
recipes on the site. Evaluated and **not rejected outright**, but flagged as
carrying enough weight that it shouldn't be built incrementally on top of the
current architecture without a deliberate, separate decision.

What it would actually require, and why each point matters:

- **Legal exposure over user content.** The moment strangers can upload to
  the domain, the site inherits copyright and moderation liability it
  currently has none of. DMCA safe-harbor protection requires a registered
  agent with the U.S. Copyright Office and a real takedown process — this is
  a legal step, not a feature flag.
- **Works against the SEO strategy that funds the ad side.** If uploaded
  recipes get indexed, there's zero editorial control over duplicate/thin
  content landing on the domain — the exact pattern Google's helpful-content
  systems penalize. If uploads *aren't* indexed, the feature drives no
  organic traffic and has to stand alone on subscription revenue with no
  assist from the ad-revenue growth engine.
- **Brand conflict.** "Dumas Family Recipes" signals a closed, curated,
  trusted collection. Paying strangers uploading their own content to a site
  named after the family is a real positioning tension — the trust that makes
  the ad-revenue side work ("this recipe is tested by us") doesn't
  automatically extend to arbitrary uploaded content. Would likely need a
  separate brand or a clearly separated section.
- **Crowded, cheap market.** Paprika is a $5 one-time purchase; Plan to Eat
  and AnyList already exist. Needs a concrete differentiator before it's
  worth building toward, not just "recipe storage."
- **Different business model entirely.** This is SaaS (recurring billing,
  Stripe, failed payments, refunds, per-user storage costs, support load,
  GDPR/CCPA data export and deletion obligations), not a content site. It
  reintroduces every piece of infrastructure (`auth`, database) that
  `CLAUDE.md` currently excludes on purpose.

**Lower-risk version, if pursued:** capped free private storage, paid for
more, **no public uploads**. This sidesteps the copyright and SEO problems
entirely because it's private storage, not public user-generated content. It
earns less per user but carries a fraction of the risk. If this path is ever
picked up, start there — not with public uploads.

---

## The operating principle

Two different goals keep getting conflated in monetization ideas for this
site, and they pull in different directions:

- **Acquisition** — getting new people to the site. Served by SEO, content
  volume, Pinterest, seasonal timing. This is what ad revenue depends on.
- **Retention** — getting existing visitors to come back or pay. Served by
  accounts, favoriting, email, a paid storage tier. This does *not* feed ad
  revenue and shouldn't be justified as if it does.

When a new monetization or engagement idea comes up, the first question is
which of these two it actually serves — and whether that's the goal being
optimized for at the time.
