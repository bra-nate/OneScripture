import { type SelectHTMLAttributes } from "react";

import { classNames } from "@/components/ui/classNames";

export type SelectControlSize = "small" | "medium";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  controlSize?: SelectControlSize;
}

export function Select({
  children,
  className,
  controlSize = "medium",
  ...props
}: SelectProps) {
  return (
    <span className={classNames("relative inline-grid min-w-0", className)}>
      <select
        className={classNames(
          "w-full appearance-none rounded-control border border-border bg-field pl-5 pr-12 font-sans text-field-foreground outline-none transition-[border-color,box-shadow] duration-200 focus:border-focus focus-visible:ring-2 focus-visible:ring-focus/20 disabled:cursor-not-allowed disabled:opacity-55",
          SELECT_SIZES[controlSize],
        )}
        {...props}
      >
        {children}
      </select>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute right-5 top-1/2 size-4 -translate-y-1/2 text-text-muted"
        fill="none"
        focusable="false"
        viewBox="0 0 16 16"
      >
        <path
          d="m4 6 4 4 4-4"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    </span>
  );
}

const SELECT_SIZES: Record<SelectControlSize, string> = {
  small: "min-h-11 text-xs",
  medium: "min-h-14 text-sm",
};
