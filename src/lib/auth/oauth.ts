export const OAUTH_PROVIDERS = ["google", "apple"] as const;

export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

const DEFAULT_AUTH_DESTINATION = "/dashboard";
const LOCAL_SITE_URL = "http://localhost:3000";

export function isOAuthProvider(value: string): value is OAuthProvider {
  return OAUTH_PROVIDERS.some((provider) => provider === value);
}

export function getOAuthCallbackUrl(
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL || LOCAL_SITE_URL,
): string {
  const callbackUrl = new URL("/auth/callback", siteUrl);
  callbackUrl.searchParams.set("next", DEFAULT_AUTH_DESTINATION);
  return callbackUrl.toString();
}

export function getSafeAuthDestination(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return DEFAULT_AUTH_DESTINATION;
  }

  const parsed = new URL(value, LOCAL_SITE_URL);
  if (parsed.origin !== LOCAL_SITE_URL) return DEFAULT_AUTH_DESTINATION;

  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}
