export function parsePassageQueryNumber(
  value: string | string[] | undefined,
): number | null {
  if (typeof value !== "string" || value.length === 0) return null;
  return Number(value);
}
