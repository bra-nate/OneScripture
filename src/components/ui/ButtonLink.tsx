import Link, { type LinkProps } from "next/link";
import { type AnchorHTMLAttributes } from "react";

import {
  getButtonClassName,
  type ButtonSize,
  type ButtonVariant,
} from "@/components/ui/buttonStyles";

export interface ButtonLinkProps
  extends LinkProps,
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> {
  size?: ButtonSize;
  variant?: ButtonVariant;
}

export function ButtonLink({
  children,
  className,
  size = "medium",
  variant = "primary",
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={getButtonClassName({ className, size, variant })}
      {...props}
    >
      {children}
    </Link>
  );
}
