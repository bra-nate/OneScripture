import { classNames } from "@/components/ui/classNames";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "small" | "medium" | "large" | "circle";

interface ButtonStyleOptions {
  className?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

export function getButtonClassName({
  className,
  size = "medium",
  variant = "primary",
}: ButtonStyleOptions = {}): string {
  return classNames(
    "inline-flex items-center justify-center rounded-[4px] font-sans text-sm font-semibold transition-[background-color,color,border-color,opacity,transform] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:translate-y-px",
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
    className,
  );
}

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "border border-transparent bg-surface-strong text-surface-strong-foreground hover:opacity-85",
  secondary:
    "border border-current bg-transparent text-text-primary hover:bg-surface hover:text-accent",
  ghost:
    "border border-transparent bg-transparent text-text-primary hover:bg-surface",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  small: "min-h-10 px-3 py-2 text-xs",
  medium: "min-h-12 px-5 py-3",
  large: "min-h-12 px-6 py-3 uppercase tracking-wide",
  circle: "size-12 rounded-full p-0",
};
