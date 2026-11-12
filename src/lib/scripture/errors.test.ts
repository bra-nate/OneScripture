import { describe, expect, it } from "vitest";

import {
  getScriptureErrorPresentation,
  toScriptureServiceError,
} from "@/lib/scripture/errors";

describe("scripture service errors", () => {
  it.each([
    [{ code: "57014", message: "canceling statement" }, "catalogue_timeout"],
    [{ code: "42501", message: "permission denied" }, "catalogue_permission_denied"],
    [{ code: "PGRST205", message: "table missing from schema cache" }, "catalogue_misconfigured"],
    [{ code: "08006", message: "connection failure" }, "catalogue_unavailable"],
  ] as const)("classifies %o as %s", (cause, expectedCode) => {
    expect(toScriptureServiceError(cause, "Unavailable").code).toBe(expectedCode);
  });

  it("keeps service details out of user-facing copy", () => {
    const cause = { code: "PGRST205", message: "secret_table is missing" };
    const error = toScriptureServiceError(cause, "Unavailable");

    expect(getScriptureErrorPresentation(error)).toEqual({
      label: "Scripture is not ready in this environment",
      message: "The catalogue needs attention. Please try again later.",
    });
  });
});
