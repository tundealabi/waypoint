export function positionBetween(before: number | null, after: number | null): number {
  if (before == null && after == null) {
    return 0;
  }
  if (before == null) {
    return after! - 1;
  }
  if (after == null) {
    return before + 1;
  }
  if (!(before < after)) {
    throw new Error(`positionBetween: expected before < after, got ${before} and ${after}`);
  }
  return (before + after) / 2;
}
