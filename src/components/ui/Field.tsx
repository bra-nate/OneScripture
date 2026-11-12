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
    <div className={classNames("grid min-w-0 gap-2", className)}>
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
        "min-h-14 min-w-0 w-full rounded-control border border-border bg-field px-5 font-sans text-base text-field-foreground outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-[var(--color-muted-dark)] focus:border-focus focus-visible:ring-2 focus-visible:ring-focus/20 disabled:cursor-not-allowed disabled:opacity-55",
        className,
      )}
      id={id ?? name}
      name={name}
      {...props}
    />
  );
}

export const Field = Object.assign(FieldRoot, { Input: FieldInput });
