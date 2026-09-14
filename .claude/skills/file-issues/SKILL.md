---
name: file-issues
description: >-
  Turn findings from a codebase review, audit, or strategy document into
  well-scoped GitHub issues in this repo. Use this whenever the user asks to
  file, open, create, or "make" issues or tickets — including phrasings like
  "make issues for the P0 items", "open a ticket for that", "turn this review
  into issues", "track these as issues", or "file that as a bug" — and also
  when a review you just produced is obviously headed for the issue tracker
  even if the user hasn't said the word "issue" yet. The whole value of an
  issue is that someone with none of your current context can act on it
  months from now, and the steps here are what make that true.
---

# Filing issues from a review

An issue is read cold. Whoever picks it up — the author, a future session,
you in three months — will not have the conversation that produced it, the
grep output you were looking at, or the reasoning you did and discarded. If
that context isn't in the body, it's gone.

So the job isn't "summarize the finding." It's: leave behind enough evidence
that someone can confirm the problem is real, enough specificity that they
know where to start, and enough of your reasoning that they don't redo the
thinking you already did.

## Step 1 — Look before you file

List the open issues first. A duplicate is worse than nothing: it splits the
discussion and both copies rot. If something related already exists, decide
deliberately whether to file a new issue that references it, or add a comment
to the one that's there.

Check whether the repo has labels or issue types in use. If it doesn't, don't
invent a taxonomy — an unfamiliar label scheme on a personal repo is noise.

## Step 2 — Ground every claim in the code

Before writing a line of the issue, go read the thing. Then cite it:
`components/RecipeDetail.tsx:70`, not "the recipe component."

Verify rather than assume, and prefer evidence that comes out of running
something over evidence that comes out of reading it:

- Claiming a field is unused? `grep -l '"image"' content/recipes/*.json` and
  report the count.
- Claiming the markup is wrong? Build it and extract the real output from
  `.next/server/app/` rather than reasoning about what the code should emit.
- Claiming something is missing? Confirm it's missing everywhere, not just in
  the first file you opened.

This matters more than it sounds. A review done from memory or from a brief
will confidently repeat the brief's own assumptions. Reading the code is how
you catch that the strategy doc says "nine category pages" when only eight
are generated, or that a field exists in the type but is set on zero records.
Those corrections are usually the most valuable thing in the issue.

**Say plainly what you could not verify.** If the sandbox can't reach the
live site, or you can't see the production env vars, write that into the
issue as a verification step rather than asserting a conclusion. An issue
that opens with "confirm X, then do A or B depending" is honest and still
actionable. An issue that asserts production is broken when you never checked
burns the reader's trust the first time they look and find it fine.

## Step 3 — Decide what counts as one issue

One issue per independently actionable piece of work. The test: could someone
close this without touching anything else in the list? Then it's its own
issue.

Resist both failure modes. A single mega-issue with nine checkboxes never gets
closed and nobody can tell what's left. Nine issues for what is really one
edit fragments the work and buries the actual change in tracker overhead.

## Step 4 — Ask, but only about what changes the issue

Ask the user when the answer materially changes what the issue says — a fork
in approach, a fact only they have, scope that could be a one-line fix or a
month of work. Don't ask about things you can determine yourself by reading
the code, and don't ask about conventional defaults.

Good reasons to ask:

- Only they know it: "is this env var actually set in production?"
- It forks the approach: "derive this value, or add an explicit field and
  backfill every record?"
- It changes the scale enormously: "do you already have these assets, or is
  this a from-scratch project?"

When you ask, make the options concrete and load them with the tradeoff, so
the answer is informed. "Commit to `public/`" means nothing on its own;
"simplest, no service, but 39 photos live in git history permanently" lets
someone actually choose. Recommend one when you have a real opinion, and say
why.

Some decisions shouldn't be resolved by you *or* by a question — they depend
on information that won't exist until the work starts. Write those into the
issue as an explicit open decision with the options laid out, and say when
it should be settled.

## Step 5 — Write the body

A shape that works, adapted to the finding rather than filled in mechanically:

1. **What's wrong, with evidence.** Lead with the observable problem. Quote
   the offending code or the real output. Cite paths and line numbers.
2. **Why it matters.** The consequence, concretely. "No rich result appears"
   beats "this is bad for SEO." If the impact is uncertain, say so.
3. **What to do.** Numbered, scoped to the files that actually exist in this
   repo. Name the file to edit. Sketch the code when the shape isn't obvious.
   This is what separates an issue from a complaint.
4. **Rejected alternatives, and why.** If you considered an approach and
   turned it down, record it with the specific reason. Otherwise the next
   person proposes it again and spends the same hour rediscovering the
   problem.
5. **Dependencies and related issues.** What must land first, what this
   unblocks.

Keep the reasoning in prose where it's reasoning. A table earns its place for
genuinely parallel options (storage choices, tradeoffs); it doesn't for a
sequence of steps.

**Worked example of point 4.** The recipe JSON-LD was missing `cookTime`. The
obvious fix is `total - active`, and it's wrong: on `grilled-chicken-rice-bowl`
(`active: 25`, `total: 50`) the missing 25 minutes is marinating, not cooking.
Naming that one recipe in the issue is what stops the derived version from
being reimplemented later. A bare "we decided not to derive it" wouldn't.

## Step 6 — Link them together

When you file several at once, wire up the ordering explicitly: "depends on
#13 — a robots.txt pointing at a localhost sitemap is worse than none."
Whoever starts at the bottom of the list needs to know they're about to do
the work in the wrong order.

Reference existing issues rather than absorbing them. If a new infrastructure
issue unblocks an older content issue, say so in the new one and leave the
old one open — it still tracks work the new issue doesn't do.

Close the loop with the repo's attribution convention, using whatever footer
this session's guidance specifies.

## Step 7 — Report back

Give the user the numbers and titles as a short table, then say what your
questions actually changed about the issues — they answered them, and they
should see the effect. Call out any dependency ordering. Don't re-narrate the
bodies; they can read them.

## Repo-specific verification

Useful ways to get real evidence in this codebase:

```bash
npm run validate                          # vocabulary + schema, prints errors and warnings
npm run build                             # runs validate first via prebuild
grep -o '<title>[^<]*</title>' .next/server/app/desserts.html
```

After a build, `.next/server/app/**.html` holds the prerendered output — the
place to confirm what actually ships in `<head>`, in the JSON-LD, and in the
body, as opposed to what the components look like they'd produce.

`content/taxonomy.ts` and `content/types.ts` are the spec for vocabulary and
shape. Any issue proposing a schema change should say what happens to the
existing recipe files, and whether `scripts/validate-recipes.ts` needs a new
rule to keep the change honest. An optional field that the validator never
checks tends to quietly stay empty — `image` is already sitting in
`content/types.ts` set on zero of 39 recipes for exactly that reason.
