import { type HTMLAttributes } from "react";

import { classNames } from "@/components/ui/classNames";

export type SurfaceVariant = "default" | "strong" | "quiet";

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SurfaceVariant;
}

export function Surface({
  children,
  className,
  variant = "default",
  ...props
}: SurfaceProps) {
  return (
    <div
      className={classNames(
        "rounded-[4px] border border-border",
        SURFACE_VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

const SURFACE_VARIANTS: Record<SurfaceVariant, string> = {
  default: "bg-surface text-text-primary",
  strong: "surface-strong-context bg-surface-strong text-surface-strong-foreground",
  quiet: "bg-transparent text-text-primary",
};
