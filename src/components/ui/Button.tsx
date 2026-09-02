import { type ButtonHTMLAttributes } from "react";

import {
  getButtonClassName,
  type ButtonSize,
  type ButtonVariant,
} from "@/components/ui/buttonStyles";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isPending?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

export function Button({
  children,
  className,
  disabled,
  isPending = false,
  size = "medium",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={getButtonClassName({ className, size, variant })}
      disabled={disabled || isPending}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
