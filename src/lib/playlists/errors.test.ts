import { describe, expect, it } from "vitest";

import {
  getPlaylistErrorPresentation,
  PlaylistError,
} from "@/lib/playlists/errors";

describe("playlist error presentation", () => {
  it("keeps internal service details out of the unavailable message", () => {
    const presentation = getPlaylistErrorPresentation(
      new PlaylistError("unavailable", "permission denied for relation playlist_items"),
    );

    expect(presentation.label).toBe("Playlists temporarily unavailable");
    expect(presentation.message).not.toContain("permission denied");
  });

  it("distinguishes an expired session from an empty playlist collection", () => {
    expect(
      getPlaylistErrorPresentation(
        new PlaylistError("unauthorized", "A signed-in user is required."),
      ),
    ).toEqual({
      label: "Sign in required",
      message: "Sign in again to view your playlists.",
    });
  });
});
