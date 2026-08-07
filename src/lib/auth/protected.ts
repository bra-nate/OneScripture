/** Route prefixes that require authentication. Single source of truth. */
export const PROTECTED_PREFIXES = [
  "/dashboard",
  "/playlist",
  "/history",
  "/favourites",
  "/settings",
];

/** True when the pathname equals or is nested under a protected prefix. */
export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}
