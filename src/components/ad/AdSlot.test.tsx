import { render } from "@testing-library/react";
import { expect, test } from "vitest";
import { AdSlot } from "@/components/ad/AdSlot";

test("renders nothing when ADS_ENABLED is false", () => {
  // APP_CONFIG.ADS_ENABLED is false by default in this slice.
  const { container } = render(<AdSlot slotId="footer" />);
  expect(container.firstChild).toBeNull();
});
