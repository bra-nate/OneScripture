import { createHmac } from "node:crypto";

import { type NextRequest } from "next/server";

import {
  parseCreateSelectionRequest,
  SelectionRequestError,
} from "@/lib/audio/selection-contract";
import { SelectionServiceError } from "@/lib/audio/selection-orchestration";
import {
  createCanonicalAudioSelection,
  enforceCanonicalAudioSelectionRateLimit,
} from "@/lib/audio/selection-service";
import { getBook } from "@/lib/bible/reference";
import { getCanonicalPassage } from "@/lib/scripture/catalogue";
import { ScriptureError } from "@/lib/scripture/errors";
import { normalizeScriptureSelection } from "@/lib/scripture/selections";
import { createClient } from "@/lib/supabase/server";

const MAX_REQUEST_BYTES = 16 * 1024;

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request);
    const input = parseCreateSelectionRequest(body);
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError && userError.name !== "AuthSessionMissingError") {
      throw new Error("Unable to resolve the current session");
    }
    const userId = user?.id ?? null;
    await enforceCanonicalAudioSelectionRateLimit(
      createRateLimitKey(request, userId),
    );

    let translationId: string | null = null;
    const normalized = await normalizeScriptureSelection(
      input.references,
      input.translationId,
      async (reference, translationCode) => {
        const passage = await getCanonicalPassage(reference, translationCode);
        if (
          !passage.translation.canGenerateAudio ||
          !passage.translation.canStreamAudio
        ) {
          throw new SelectionRequestError(
            "unsupported_translation",
            "This translation does not permit generated streaming audio.",
          );
        }
        translationId ??= passage.translation.id;
        if (translationId !== passage.translation.id) {
          throw new Error("Selection resolved across multiple translations");
        }
        return passage;
      },
    );
    if (!translationId) throw new Error("Selection did not resolve a translation");

    const result = await createCanonicalAudioSelection({
      userId,
      translationCode: input.translationId,
      translationId,
      voiceId: input.voiceId,
      verses: normalized.verses.map((verse) => ({
        id: verse.id,
        displayReference: formatVerseReference(
          verse.bookId,
          verse.chapter,
          verse.verse,
        ),
      })),
    });

    return Response.json(result, {
      status: result.status === "ready" ? 200 : 202,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return selectionErrorResponse(error);
  }
}

async function readJsonBody(request: Request): Promise<unknown> {
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    throw new SelectionRequestError("invalid_request", "The request body is too large.");
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_REQUEST_BYTES) {
    throw new SelectionRequestError("invalid_request", "The request body is too large.");
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new SelectionRequestError(
      "invalid_request",
      "The request body must contain valid JSON.",
    );
  }
}

function createRateLimitKey(request: Request, userId: string | null): string {
  const forwardedAddresses = request.headers
    .get("x-forwarded-for")
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const address =
    request.headers.get("x-real-ip")?.trim() ||
    forwardedAddresses?.at(-1) ||
    "unknown";
  const actor = userId
    ? `user:${userId}`
    : `anonymous:${address}:${request.headers.get("user-agent") ?? "unknown"}`;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("The selection rate-limit secret is unavailable");
  return createHmac("sha256", secret).update(actor, "utf8").digest("hex");
}

function formatVerseReference(
  bookId: string,
  chapter: number,
  verse: number,
): string {
  return `${getBook(bookId)?.name ?? bookId} ${chapter}:${verse}`;
}

function selectionErrorResponse(error: unknown): Response {
  if (error instanceof SelectionRequestError) {
    const status = error.code === "invalid_request" ? 400 : 422;
    return apiError(error.code, error.message, status);
  }
  if (error instanceof ScriptureError) {
    const statusByCode = {
      invalid_reference: 400,
      passage_not_found: 404,
      selection_too_large: 413,
      catalogue_unavailable: 503,
    } as const;
    return apiError(error.code, error.message, statusByCode[error.code]);
  }
  if (error instanceof SelectionServiceError) {
    if (error.code === "rate_limited") {
      return apiError(error.code, error.message, 429, { "Retry-After": "60" });
    }
    return apiError(
      error.code,
      "The audio selection could not be prepared.",
      503,
    );
  }
  console.error("Audio selection creation failed", error);
  return apiError(
    "selection_unavailable",
    "The audio selection service is temporarily unavailable.",
    500,
  );
}

function apiError(
  code: string,
  message: string,
  status: number,
  headers?: HeadersInit,
): Response {
  return Response.json(
    { error: { code, message } },
    {
      status,
      headers: { "Cache-Control": "private, no-store", ...headers },
    },
  );
}
