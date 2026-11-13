import { type InputHTMLAttributes } from "react";

import { classNames } from "@/components/ui/classNames";

export type RangeProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function Range({ className, ...props }: RangeProps) {
  return (
    <input
      className={classNames(
        "range-control min-h-11 w-full disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      type="range"
      {...props}
    />
  );
}
