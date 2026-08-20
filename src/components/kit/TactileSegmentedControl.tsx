import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { cx } from "./styles";

export interface SegmentOption<T extends string = string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  badge?: string | number;
}

export interface TactileSegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (val: T) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function TactileSegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  size = "md",
  className,
}: TactileSegmentedControlProps<T>) {
  const sizeClasses = {
    sm: "p-0.5 text-xs h-8",
    md: "p-1 text-xs sm:text-sm h-10",
    lg: "p-1.5 text-sm sm:text-base h-12",
  };

  const itemPadding = {
    sm: "px-3 py-1",
    md: "px-4 py-1.5",
    lg: "px-5 py-2",
  };

  return (
    <div
      className={cx(
        "relative inline-flex items-center rounded-full border border-[#e5e5e5] bg-[#f5f5f5] shadow-xs select-none",
        sizeClasses[size],
        className
      )}
    >
      {options.map((opt) => {
        const isSelected = value === opt.value;

        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cx(
              "relative flex items-center justify-center gap-1.5 rounded-full font-medium transition-colors outline-none cursor-pointer z-10",
              itemPadding[size],
              isSelected ? "text-[#0a0a0a]" : "text-[#6b6b6b] hover:text-[#0a0a0a]"
            )}
          >
            {/* Sliding Spring Highlight Pill */}
            {isSelected && (
              <motion.div
                layoutId="tactileSegmentPill"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                className="absolute inset-0 rounded-full bg-white border border-[#e5e5e5] shadow-sm"
              />
            )}

            <span className="relative z-10 flex items-center gap-1.5">
              {opt.icon && <span className="shrink-0">{opt.icon}</span>}
              <span>{opt.label}</span>
              {opt.badge !== undefined && (
                <span className="rounded-full bg-[#0a0a0a] text-white px-1.5 py-0.2 text-[10px] font-mono font-semibold">
                  {opt.badge}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
