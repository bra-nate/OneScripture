const LOCAL_SITE_URL = "http://localhost:3000";

export function getPasswordRecoveryCallbackUrl(
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL || LOCAL_SITE_URL,
): string {
  const callbackUrl = new URL("/auth/callback", siteUrl);
  callbackUrl.searchParams.set("next", "/update-password");
  return callbackUrl.toString();
}
