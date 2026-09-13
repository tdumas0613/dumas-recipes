#!/usr/bin/env npx tsx
/**
 * resolve.ts — mechanical ingredient/unit resolution for the import-recipe
 * skill. Calls the site's own resolveIngredient()/resolveUnit() from
 * content/taxonomy.ts so the skill never has to eyeball-match a raw string
 * against the taxonomy itself. Run from the repo root.
 *
 * Input (stdin), JSON:
 *   { "ingredients": ["beef mince", "unknown thing"], "units": ["g", "cup"] }
 * Either key may be omitted or empty.
 *
 * Output (stdout), JSON:
 *   {
 *     "ingredients": [
 *       { "raw": "beef mince", "resolved": "ground beef" },
 *       { "raw": "unknown thing", "resolved": null }
 *     ],
 *     "units": [
 *       { "raw": "g", "resolved": null },
 *       { "raw": "cup", "resolved": "cup" }
 *     ],
 *     "allResolved": false
 *   }
 *
 * A `resolved: null` entry is the signal to stop and ask the human — see
 * SKILL.md. This script only reports; it never guesses on your behalf.
 */

import { resolveIngredient, resolveUnit } from "../../../../content/taxonomy";

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

async function main() {
  const raw = await readStdin();
  if (!raw.trim()) {
    console.error("resolve.ts: expected JSON on stdin, e.g. " + '{"ingredients":["beef mince"],"units":["g"]}');
    process.exit(2);
  }

  let input: { ingredients?: string[]; units?: string[] };
  try {
    input = JSON.parse(raw);
  } catch (e) {
    console.error(`resolve.ts: input was not valid JSON: ${(e as Error).message}`);
    process.exit(2);
    return;
  }

  const ingredients = (input.ingredients ?? []).map((raw) => ({
    raw,
    resolved: resolveIngredient(raw),
  }));
  const units = (input.units ?? []).map((raw) => ({
    raw,
    resolved: resolveUnit(raw),
  }));

  const allResolved =
    ingredients.every((i) => i.resolved !== null) && units.every((u) => u.resolved !== null);

  console.log(JSON.stringify({ ingredients, units, allResolved }, null, 2));
  if (!allResolved) process.exit(1);
}

main();
