import Image from "next/image";
import type { Recipe } from "@/content/types";

/**
 * A recipe photograph, or the hatched placeholder from the brand guide when
 * there isn't one yet — a missing photo ships as hatching rather than as a
 * stock image. The flat rule border and the 4:3 (grid) / 4:5 (hero) crops
 * come from the `.shot` / `.dshot` rules, so a photo drops in without the
 * layout moving.
 *
 * `sizes` is worth keeping honest: the hero sits in a fixed 360px column and
 * a grid card tops out around 340px, so without it next/image would serve a
 * full-width candidate and the layout shift it avoids would be paid for in
 * bytes instead.
 */
export function Shot({
  className,
  image,
  sizes,
  priority,
}: {
  className: string;
  image?: Recipe["image"];
  sizes?: string;
  priority?: boolean;
}) {
  if (!image) return <div className={className} aria-hidden="true" />;

  return (
    <div className={className}>
      <Image src={image.src} alt={image.alt} fill sizes={sizes} priority={priority} />
    </div>
  );
}
