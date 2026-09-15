/**
 * Stands in for a recipe photograph. Until real photography exists this is
 * the hatched placeholder from the brand guide — a missing photo ships as
 * hatching rather than as a stock image. The flat rule border and the 4:3
 * (grid) / 4:5 (hero) crops come from the `.shot` / `.dshot` rules, so the
 * real <img> can drop in here later without the layout moving.
 */
export function Shot({ className }: { className: string }) {
  return <div className={className} aria-hidden="true" />;
}
