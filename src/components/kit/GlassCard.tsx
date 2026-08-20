import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cx } from "./styles";

export interface GlassCardProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  interactive?: boolean;
  children: ReactNode;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ interactive = false, children, className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={interactive ? { y: -3 } : undefined}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className={cx(
          "relative rounded-2xl border border-[#e5e5e5] bg-white/90 backdrop-blur-md shadow-xs transition-all duration-300 overflow-hidden",
          interactive && "cursor-pointer hover:border-[#0a0a0a]/30 hover:shadow-md",
          className
        )}
        {...(props as HTMLMotionProps<"div">)}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = "GlassCard";

export function GlassCardHeader({
  title,
  subtitle,
  action,
  icon,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex items-start justify-between gap-4 p-5 sm:p-6 pb-2", className)}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f5f5f5] border border-[#e5e5e5] text-[#0a0a0a]">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-base font-semibold text-[#0a0a0a] tracking-tight">{title}</h3>
          {subtitle && <p className="text-xs text-[#6b6b6b] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

export function GlassCardBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cx("p-5 sm:p-6", className)}>{children}</div>;
}

export function GlassCardFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "flex items-center justify-between border-t border-[#e5e5e5] bg-[#fafafa] px-5 sm:px-6 py-3.5 text-xs text-[#6b6b6b]",
        className
      )}
    >
      {children}
    </div>
  );
}
