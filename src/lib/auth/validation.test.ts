import { expect, test } from "vitest";
import { validateEmail, validatePassword } from "@/lib/auth/validation";

test("valid email passes", () => expect(validateEmail("a@b.com")).toBeNull());
test("empty email fails", () => expect(validateEmail("")).toBeTypeOf("string"));
test("malformed email fails", () => expect(validateEmail("nope")).toBeTypeOf("string"));
test("valid password passes", () => expect(validatePassword("secret1")).toBeNull());
test("short password fails", () => expect(validatePassword("abc")).toBeTypeOf("string"));
