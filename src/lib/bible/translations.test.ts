import { describe, expect, it } from "vitest";

import { getTranslation } from "@/lib/bible/translations";

describe("getTranslation", () => {
  it("uses KJV when no valid translation is requested", () => {
    expect(getTranslation().id).toBe("KJV");
    expect(getTranslation("UNKNOWN").id).toBe("KJV");
  });

  it("preserves an explicitly requested supported translation", () => {
    expect(getTranslation("WEB").id).toBe("WEB");
  });
});
