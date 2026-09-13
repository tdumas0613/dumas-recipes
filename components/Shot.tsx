export function Shot({
  tint,
  className,
}: {
  tint: readonly [string, string];
  className: string;
}) {
  return (
    <div
      className={className}
      style={{ background: `linear-gradient(148deg, ${tint[0]}, ${tint[1]})` }}
    />
  );
}
