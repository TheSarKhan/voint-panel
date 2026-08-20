import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cx } from "./styles";

export type ButtonVariant =
  | "primary"
  | "primary-cta"
  | "secondary"
  | "ghost"
  | "danger"
  | "outline";

export type ButtonSize = "xs" | "sm" | "md" | "lg" | "icon";

export interface GlassButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: ReactNode;
}

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses: Record<ButtonSize, string> = {
      xs: "h-7 px-3 text-xs gap-1.5 rounded-full font-medium",
      sm: "h-8.5 px-4 text-xs font-medium gap-2 rounded-full",
      md: "h-10 px-5 text-sm font-medium gap-2.5 rounded-full",
      lg: "h-12 px-6 text-base font-medium gap-3 rounded-full",
      icon: "h-9 w-9 p-0 flex items-center justify-center rounded-full",
    };

    const variantClasses: Record<ButtonVariant, string> = {
      primary:
        "bg-[#0a0a0a] text-white hover:bg-[#0a0a0a]/85 shadow-sm border border-black/10 active:bg-black/90",
      "primary-cta":
        "bg-[#0a0a0a] text-white hover:bg-[#0a0a0a]/85 shadow-sm border border-black/10 active:bg-black/90",
      secondary:
        "bg-white/90 hover:bg-[#f5f5f5] text-[#0a0a0a] border border-[#e5e5e5] hover:border-[#0a0a0a]/30 shadow-xs backdrop-blur-md",
      ghost:
        "bg-transparent hover:bg-[#f5f5f5] text-[#6b6b6b] hover:text-[#0a0a0a] border border-transparent",
      danger:
        "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200",
      outline:
        "bg-transparent hover:bg-[#f5f5f5] text-[#0a0a0a] border border-[#e5e5e5] hover:border-[#0a0a0a]",
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.01 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        disabled={disabled || isLoading}
        className={cx(
          "relative inline-flex items-center justify-center select-none font-sans outline-none transition-all duration-200 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...(props as HTMLMotionProps<"button">)}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-current" />
        ) : (
          <>
            {leftIcon && <span className="inline-flex shrink-0 items-center">{leftIcon}</span>}
            {children && <span>{children}</span>}
            {variant === "primary-cta" && !rightIcon ? (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#39ff14] text-[#0a0a0a] shrink-0 ml-0.5">
                <svg className="h-2.5 w-2.5 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            ) : (
              rightIcon && <span className="inline-flex shrink-0 items-center">{rightIcon}</span>
            )}
          </>
        )}
      </motion.button>
    );
  }
);

GlassButton.displayName = "GlassButton";
