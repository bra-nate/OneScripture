import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button, Field, Status, Surface } from "@/components/ui";

describe("design-system primitives", () => {
  it("defaults buttons to a non-submitting type", () => {
    render(<Button>Listen</Button>);

    expect(screen.getByRole("button", { name: "Listen" })).toHaveProperty(
      "type",
      "button",
    );
  });

  it("disables a pending button", () => {
    render(<Button isPending>Preparing</Button>);

    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Preparing" }).disabled).toBe(true);
  });

  it("connects field labels to their input", () => {
    render(
      <Field label="Passage" name="passage">
        <Field.Input name="passage" />
      </Field>,
    );

    expect(screen.getByLabelText("Passage").getAttribute("id")).toBe("passage");
  });

  it("announces labeled statuses without relying on color", () => {
    render(
      <Status label="Audio ready" tone="success">
        All verses are available.
      </Status>,
    );

    expect(screen.getByRole("status").textContent).toContain("Audio ready");
    expect(screen.getByRole("status").textContent).toContain("All verses are available.");
  });

  it("renders a reusable surface shell", () => {
    render(<Surface>Passage details</Surface>);

    expect(screen.getByText("Passage details").classList.contains("bg-surface")).toBe(true);
  });
});
