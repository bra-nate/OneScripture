import { APP_CONFIG } from "@/config/app";

export type AdSlotId =
  | "homepage-hero"
  | "player-sidebar"
  | "download-interstitial"
  | "footer";

/**
 * Reserved ad placement. Renders nothing while ADS_ENABLED is false, so the
 * layout can carry slots from day one without showing anything until ads are
 * activated (Phase 2). Never hardcode ad markup — always use this component.
 */
export function AdSlot({ slotId }: { slotId: AdSlotId }) {
  if (!APP_CONFIG.ADS_ENABLED) return null;
  return (
    <div
      data-slot-id={slotId}
      className="rounded-md border border-border bg-surface"
    />
  );
}
