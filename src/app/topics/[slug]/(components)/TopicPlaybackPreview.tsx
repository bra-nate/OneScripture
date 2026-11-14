import { ScriptureAudioPlayer } from "@/components/player";
import { type SelectionTranslationId } from "@/lib/audio/selection-contract";

export interface TopicPlaybackPreviewProps {
  references: string[];
  title: string;
  translationCode: SelectionTranslationId;
}

export function TopicPlaybackPreview({
  references,
  title,
  translationCode,
}: TopicPlaybackPreviewProps) {
  return (
    <ScriptureAudioPlayer
      references={references}
      title={`${title} listening`}
      translationCode={translationCode}
    />
  );
}
