import { describe, expect, test } from "vitest";

import { getOAuthCallbackUrl, getSafeAuthDestination, isOAuthProvider } from "@/lib/auth/oauth";

describe("OAuth providers", () => {
  test("accepts only configured provider names", () => {
    expect(isOAuthProvider("google")).toBe(true);
    expect(isOAuthProvider("apple")).toBe(true);
    expect(isOAuthProvider("github")).toBe(false);
  });
});

describe("OAuth callback URL", () => {
  test("uses localhost in development", () => {
    expect(getOAuthCallbackUrl("http://localhost:3000")).toBe(
      "http://localhost:3000/auth/callback?next=%2Fdashboard",
    );
  });

  test("uses the configured site origin", () => {
    expect(getOAuthCallbackUrl("https://onescripture.example")).toBe(
      "https://onescripture.example/auth/callback?next=%2Fdashboard",
    );
  });
});

describe("OAuth destination", () => {
  test("accepts an internal path", () => {
    expect(getSafeAuthDestination("/playlist?view=recent")).toBe(
      "/playlist?view=recent",
    );
  });

  test.each([
    null,
    "https://example.com",
    "//example.com",
    "/\\example.com",
  ])("falls back for unsafe destination %s", (destination) => {
    expect(getSafeAuthDestination(destination)).toBe("/dashboard");
  });
});
