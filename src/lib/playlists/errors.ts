export type PlaylistErrorCode = "unauthorized" | "unavailable";

export interface PlaylistErrorPresentation {
  label: string;
  message: string;
}

export class PlaylistError extends Error {
  constructor(
    public readonly code: PlaylistErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "PlaylistError";
  }
}

export function getPlaylistErrorPresentation(error: unknown): PlaylistErrorPresentation {
  if (error instanceof PlaylistError && error.code === "unauthorized") {
    return {
      label: "Sign in required",
      message: "Sign in again to view your playlists.",
    };
  }

  return {
    label: "Playlists temporarily unavailable",
    message: "Your saved playlists could not be loaded. Try again shortly.",
  };
}
