"use client";

import { useState, type InputHTMLAttributes } from "react";

import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { classNames } from "@/components/ui/classNames";

export interface PasswordFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "type"> {
  isLabelHidden?: boolean;
  label: string;
  name: string;
}

export function PasswordField({
  className,
  isLabelHidden = false,
  label,
  name,
  ...props
}: PasswordFieldProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const action = isRevealed ? "Hide" : "Show";

  return (
    <Field isLabelHidden={isLabelHidden} label={label} name={name}>
      <div className="relative">
        <Field.Input
          className={classNames("pr-24", className)}
          name={name}
          type={isRevealed ? "text" : "password"}
          {...props}
        />
        <Button
          aria-label={`${action} ${label.toLowerCase()}`}
          aria-pressed={isRevealed}
          className="absolute right-2 top-1/2 -translate-y-1/2"
          onClick={() => setIsRevealed((value) => !value)}
          size="small"
          variant="ghost"
        >
          {action}
        </Button>
      </div>
    </Field>
  );
}
