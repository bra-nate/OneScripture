import { type InputHTMLAttributes } from "react";

import { classNames } from "@/components/ui/classNames";

export type CheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
>;

export function Checkbox({ className, disabled, ...props }: CheckboxProps) {
  return (
    <label
      className={classNames(
        "relative inline-grid size-6 shrink-0 cursor-pointer place-items-center",
        disabled && "cursor-not-allowed",
        className,
      )}
    >
      <input
        className="peer sr-only"
        disabled={disabled}
        type="checkbox"
        {...props}
      />
      <span
        aria-hidden="true"
        className="grid size-5 place-items-center rounded-control border border-border bg-field text-field-foreground transition-[background-color,border-color,box-shadow,opacity] peer-checked:border-text-primary peer-checked:bg-text-primary peer-checked:text-background peer-focus-visible:ring-2 peer-focus-visible:ring-focus peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background peer-disabled:opacity-50"
      />
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute size-3 text-background opacity-0 transition-opacity peer-checked:opacity-100"
        fill="none"
        viewBox="0 0 12 12"
      >
        <path
          d="m2.25 6.25 2.25 2.25 5.25-5.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.75"
        />
      </svg>
    </label>
  );
}
