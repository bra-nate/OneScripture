import { APP_CONFIG } from "@/config/app";
import { Surface } from "@/components/ui";

export type AdSlotId =
  | "homepage-hero"
  | "player-sidebar"
  | "footer";

/**
 * Reserved ad placement. Renders nothing while ADS_ENABLED is false, so the
 * layout can carry slots from day one without showing anything until ads are
 * activated (Phase 2). Never hardcode ad markup — always use this component.
 */
export function AdSlot({ slotId }: { slotId: AdSlotId }) {
  if (!APP_CONFIG.ADS_ENABLED) return null;
  return (
    <Surface
      data-slot-id={slotId}
    />
  );
}
