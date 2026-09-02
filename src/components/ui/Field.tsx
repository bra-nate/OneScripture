import {
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type ReactNode,
} from "react";

import { classNames } from "@/components/ui/classNames";

export interface FieldProps {
  children: ReactNode;
  className?: string;
  hint?: string;
  label: string;
  labelProps?: LabelHTMLAttributes<HTMLLabelElement>;
  name: string;
  isLabelHidden?: boolean;
}

export type FieldInputProps = InputHTMLAttributes<HTMLInputElement>;

function FieldRoot({
  children,
  className,
  hint,
  isLabelHidden = false,
  label,
  labelProps,
  name,
}: FieldProps) {
  return (
    <div className={classNames("grid gap-2", className)}>
      <label
        className={classNames(
          "font-sans text-sm font-semibold text-text-primary",
          isLabelHidden && "sr-only",
        )}
        htmlFor={name}
        {...labelProps}
      >
        {label}
      </label>
      {children}
      {hint && (
        <p className="font-sans text-xs leading-5 text-text-muted">{hint}</p>
      )}
    </div>
  );
}

function FieldInput({ className, id, name, ...props }: FieldInputProps) {
  return (
    <input
      className={classNames(
        "min-h-12 w-full rounded-[4px] border border-border bg-surface-strong px-4 font-sans text-base text-surface-strong-foreground outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-surface-strong-foreground/55 focus:border-focus focus-visible:ring-2 focus-visible:ring-focus/30 disabled:cursor-not-allowed disabled:opacity-55",
        className,
      )}
      id={id ?? name}
      name={name}
      {...props}
    />
  );
}

export const Field = Object.assign(FieldRoot, { Input: FieldInput });
