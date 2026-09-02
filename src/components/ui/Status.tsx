import { type HTMLAttributes, type ReactNode } from "react";

import { classNames } from "@/components/ui/classNames";

export type StatusTone =
  | "neutral"
  | "information"
  | "success"
  | "warning"
  | "danger";

export interface StatusProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  label: string;
  tone?: StatusTone;
}

export function Status({
  children,
  className,
  label,
  role = "status",
  tone = "neutral",
  ...props
}: StatusProps) {
  return (
    <div
      className={classNames(
        "grid grid-cols-[auto_1fr] gap-3 rounded-[4px] border p-4 font-sans text-sm leading-6",
        STATUS_TONES[tone],
        className,
      )}
      role={role}
      {...props}
    >
      <span aria-hidden="true" className="mt-2 size-2 rounded-full bg-current" />
      <div>
        <p className="font-semibold">{label}</p>
        <div className="mt-1 opacity-80">{children}</div>
      </div>
    </div>
  );
}

const STATUS_TONES: Record<StatusTone, string> = {
  neutral: "border-border bg-surface text-text-primary",
  information:
    "border-state-information bg-state-information-surface text-state-information-foreground",
  success:
    "border-state-success bg-state-success-surface text-state-success-foreground",
  warning:
    "border-state-warning bg-state-warning-surface text-state-warning-foreground",
  danger: "border-state-danger bg-state-danger-surface text-state-danger-foreground",
};
