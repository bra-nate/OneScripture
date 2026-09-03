import { ScriptureAudioPlayer } from "@/components/player";

export interface TopicPlaybackPreviewProps {
  references: string[];
  title: string;
}

export function TopicPlaybackPreview({ references, title }: TopicPlaybackPreviewProps) {
  return <ScriptureAudioPlayer references={references} title={`${title} listening`} />;
}
