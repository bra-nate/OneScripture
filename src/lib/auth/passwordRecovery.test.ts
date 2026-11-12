import { expect, test } from "vitest";

import { getPasswordRecoveryCallbackUrl } from "@/lib/auth/passwordRecovery";

test("builds a recovery callback for the configured site", () => {
  expect(getPasswordRecoveryCallbackUrl("https://onescripture.example")).toBe(
    "https://onescripture.example/auth/callback?next=%2Fupdate-password",
  );
});
