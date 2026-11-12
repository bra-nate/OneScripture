export type ScriptureErrorCode =
  | "catalogue_misconfigured"
  | "catalogue_permission_denied"
  | "catalogue_timeout"
  | "catalogue_unavailable"
  | "invalid_reference"
  | "passage_not_found"
  | "selection_too_large";

export interface ScriptureErrorPresentation {
  label: string;
  message: string;
}

export class ScriptureError extends Error {
  constructor(
    public readonly code: ScriptureErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ScriptureError";
  }
}

export function toScriptureServiceError(
  error: unknown,
  unavailableMessage: string,
): ScriptureError {
  const { code, message } = readErrorDetails(error);

  if (
    code === "57014" ||
    code === "PGRST003" ||
    /abort|timed?\s*out|timeout/i.test(message)
  ) {
    return new ScriptureError(
      "catalogue_timeout",
      "The scripture service did not respond in time.",
    );
  }

  if (code === "42501" || /permission denied|row-level security/i.test(message)) {
    return new ScriptureError(
      "catalogue_permission_denied",
      "The scripture catalogue could not be accessed.",
    );
  }

  if (
    code === "42P01" ||
    code === "42703" ||
    code === "PGRST205" ||
    /supabase.+(?:required|url|key)|schema cache/i.test(message)
  ) {
    return new ScriptureError(
      "catalogue_misconfigured",
      "The scripture catalogue is not configured for this environment.",
    );
  }

  return new ScriptureError("catalogue_unavailable", unavailableMessage);
}

export function getScriptureErrorPresentation(
  error: unknown,
): ScriptureErrorPresentation {
  const code =
    error instanceof ScriptureError ? error.code : "catalogue_unavailable";

  switch (code) {
    case "catalogue_timeout":
      return {
        label: "The scripture service took too long to respond",
        message: "Check your connection, then try again.",
      };
    case "catalogue_misconfigured":
      return {
        label: "Scripture is not ready in this environment",
        message: "The catalogue needs attention. Please try again later.",
      };
    case "catalogue_permission_denied":
      return {
        label: "Scripture access is temporarily unavailable",
        message: "We could not access the catalogue. Please try again shortly.",
      };
    default:
      return {
        label: "Scripture is temporarily unavailable",
        message: "The scripture service could not be reached. Please try again.",
      };
  }
}

function readErrorDetails(error: unknown): { code: string; message: string } {
  if (!error || typeof error !== "object") return { code: "", message: "" };

  const candidate = error as { code?: unknown; message?: unknown };
  return {
    code: typeof candidate.code === "string" ? candidate.code : "",
    message: typeof candidate.message === "string" ? candidate.message : "",
  };
}
