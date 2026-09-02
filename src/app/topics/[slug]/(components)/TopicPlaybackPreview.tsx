export interface TopicPlaybackPreviewProps {
  passageCount: number;
}

export function TopicPlaybackPreview({ passageCount }: TopicPlaybackPreviewProps) {
  return (
    <Surface className="border-x-0 px-5 py-6 md:px-7">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Ordered listening
          </p>
          <p className="mt-2 font-sans text-sm leading-6 text-text-muted">
            {passageCount} {passageCount === 1 ? "passage" : "passages"} · Play once or repeat continuously
          </p>
        </div>
        <Button disabled type="button" variant="secondary">
          Play all soon
        </Button>
      </div>
      <p className="mt-4 font-sans text-xs leading-5 text-text-muted">
        Reading is available now. Audio will activate here when the shared scripture player is ready.
      </p>
    </Surface>
  );
}
import { Button, Surface } from "@/components/ui";
