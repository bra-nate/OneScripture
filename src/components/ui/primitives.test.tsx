import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  Button,
  Checkbox,
  Field,
  PasswordField,
  Range,
  Select,
  Status,
  Surface,
} from "@/components/ui";

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

  it("preserves native form semantics in styled controls", () => {
    render(
      <>
        <label htmlFor="translation">Translation</label>
        <Select defaultValue="WEB" id="translation">
          <option value="WEB">World English Bible</option>
        </Select>
        <Checkbox aria-label="Select John 3:16" defaultChecked />
        <Range aria-label="Playback volume" defaultValue="0.5" max="1" step="0.1" />
      </>,
    );

    expect(screen.getByLabelText("Translation").tagName).toBe("SELECT");
    expect(
      screen.getByLabelText<HTMLInputElement>("Select John 3:16").checked,
    ).toBe(true);
    expect(screen.getByLabelText("Playback volume").getAttribute("type")).toBe(
      "range",
    );
  });

  it("reveals and hides passwords without submitting the form", () => {
    render(
      <form>
        <PasswordField
          isLabelHidden
          label="Password"
          name="password"
        />
      </form>,
    );

    const password = screen.getByLabelText<HTMLInputElement>("Password");
    const reveal = screen.getByRole("button", { name: "Show password" });

    expect(password.type).toBe("password");
    expect(reveal.getAttribute("type")).toBe("button");

    fireEvent.click(reveal);
    expect(password.type).toBe("text");
    expect(screen.getByRole("button", { name: "Hide password" })).toBeTruthy();
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
