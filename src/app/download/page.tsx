import { AdSlot } from "@/components/ad/AdSlot";
import { ButtonLink, Surface } from "@/components/ui";
import { routes } from "@/config/routes";

export default async function DownloadPage({
  searchParams,
}: PageProps<"/download">) {
  const params = await searchParams;
  const audioUrl = typeof params.audioUrl === "string" ? params.audioUrl : "";
  const filename =
    typeof params.filename === "string" ? params.filename : "scripture.mp3";
  const displayRef =
    typeof params.displayRef === "string" ? params.displayRef : "Scripture audio";

  const downloadHref = `/api/download?url=${encodeURIComponent(
    audioUrl,
  )}&filename=${encodeURIComponent(filename)}`;

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-16">
      <Surface className="p-8">
        <p className="font-sans text-sm uppercase tracking-[0.2em] text-accent">
          Download ready
        </p>
        <h1 className="mt-3 font-display text-4xl text-text-primary">
          {displayRef}
        </h1>
        <p className="mt-4 font-sans leading-7 text-text-muted">
          Confirm to start your MP3 download.
        </p>
        <div className="mt-6">
          <AdSlot slotId="download-interstitial" />
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink
            href={downloadHref}
            size="large"
          >
            Download MP3
          </ButtonLink>
          <ButtonLink
            href={routes.home}
            variant="secondary"
          >
            Back home
          </ButtonLink>
        </div>
      </Surface>
    </section>
  );
}
