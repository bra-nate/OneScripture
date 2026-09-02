import {
  getCanonicalAudioSelection,
  retryCanonicalAudioSelection,
} from "@/lib/audio/selection-service";
import { SelectionStatusError } from "@/lib/audio/selection-status";
import { createClient } from "@/lib/supabase/server";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ selectionId: string }> },
) {
  const { selectionId } = await params;
  if (!UUID_PATTERN.test(selectionId)) {
    return errorResponse("selection_not_found", "The audio selection was not found.", 404);
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error && error.name !== "AuthSessionMissingError") {
      throw new Error("Unable to resolve the current session");
    }
    const userId = user?.id ?? null;
    const retried = await retryCanonicalAudioSelection(selectionId, userId);
    const selection = await getCanonicalAudioSelection(selectionId, userId);
    return Response.json(
      { ...selection, retried },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if (error instanceof SelectionStatusError) {
      const status = error.code === "selection_not_found" ? 404 : 503;
      return errorResponse(error.code, error.message, status);
    }
    console.error("Audio selection retry failed", error);
    return errorResponse(
      "selection_retry_failed",
      "The audio selection could not be retried.",
      500,
    );
  }
}

function errorResponse(code: string, message: string, status: number): Response {
  return Response.json(
    { error: { code, message } },
    { status, headers: { "Cache-Control": "private, no-store" } },
  );
}
