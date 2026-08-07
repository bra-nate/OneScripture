import { expect, test } from "vitest";
import { isProtectedPath } from "@/lib/auth/protected";

test("guards dashboard", () => expect(isProtectedPath("/dashboard")).toBe(true));
test("guards nested playlist", () => expect(isProtectedPath("/playlist/abc")).toBe(true));
test("guards history/favourites/settings", () => {
  expect(isProtectedPath("/history")).toBe(true);
  expect(isProtectedPath("/favourites")).toBe(true);
  expect(isProtectedPath("/settings")).toBe(true);
});
test("allows public routes", () => {
  expect(isProtectedPath("/")).toBe(false);
  expect(isProtectedPath("/login")).toBe(false);
  expect(isProtectedPath("/browse")).toBe(false);
});
test("does not treat /dashboardxyz as protected", () =>
  expect(isProtectedPath("/dashboardxyz")).toBe(false));
