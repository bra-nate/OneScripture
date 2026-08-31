export type ScriptureErrorCode =
  | "catalogue_unavailable"
  | "invalid_reference"
  | "passage_not_found"
  | "selection_too_large";

export class ScriptureError extends Error {
  constructor(
    public readonly code: ScriptureErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ScriptureError";
  }
}
