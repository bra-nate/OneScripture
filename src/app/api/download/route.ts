import { NextRequest } from "next/server";

const ALLOWED_AUDIO_HOSTS = new Set(["cdn.dbt.io"]);

function parseAudioUrl(value: string | null): URL | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    if (!ALLOWED_AUDIO_HOSTS.has(url.hostname)) return null;
    if (!url.pathname.toLowerCase().endsWith(".mp3")) return null;
    return url;
  } catch {
    return null;
  }
}

function safeFilename(value: string | null): string {
  const fallback = "scripture.mp3";
  if (!value) return fallback;
  const cleaned = value.replace(/[^\w.-]+/g, "-").replace(/-+/g, "-");
  return cleaned.toLowerCase().endsWith(".mp3") ? cleaned : `${cleaned}.mp3`;
}

export async function GET(request: NextRequest) {
  const url = parseAudioUrl(request.nextUrl.searchParams.get("url"));
  if (!url) {
    return Response.json({ error: "Invalid audio URL." }, { status: 400 });
  }

  const filename = safeFilename(request.nextUrl.searchParams.get("filename"));
  const upstream = await fetch(url);

  if (!upstream.ok || !upstream.body) {
    return Response.json(
      { error: "Audio download could not be started." },
      { status: 502 },
    );
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": upstream.headers.get("content-type") ?? "audio/mpeg",
      "Cache-Control": "private, no-store",
    },
  });
}
