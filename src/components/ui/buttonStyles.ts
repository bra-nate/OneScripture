import { classNames } from "@/components/ui/classNames";

export type ButtonVariant = "primary" | "secondary" | "selected" | "ghost";
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
    "inline-flex items-center justify-center rounded-control font-sans text-sm font-medium transition-[background-color,color,border-color,opacity,transform] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:translate-y-px",
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
    className,
  );
}

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "border border-transparent bg-accent text-text-primary hover:bg-accent-light",
  secondary:
    "border border-text-primary bg-transparent text-text-primary hover:bg-surface",
  selected:
    "border border-text-primary bg-text-primary text-background hover:opacity-85",
  ghost:
    "border border-transparent bg-transparent text-text-primary hover:bg-surface",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  small: "min-h-11 px-3 py-2 text-xs",
  medium: "min-h-12 px-5 py-3",
  large: "min-h-12 px-7 py-3",
  circle: "size-12 rounded-full p-0",
};
