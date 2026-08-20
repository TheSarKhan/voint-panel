import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { cx } from "./styles";

/* ================================================================== */
/* Clean Light Tabs with Framer Motion Sliding Pill                  */
/* ================================================================== */

export interface TabItem {
  id: string;
  label: string;
  count?: number | string;
  icon?: ReactNode;
}

export interface GlassTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  size?: "sm" | "md";
}

export function GlassTabs({
  tabs,
  activeTab,
  onChange,
  className,
  size = "md",
}: GlassTabsProps) {
  return (
    <div
      className={cx(
        "inline-flex items-center gap-1 rounded-full border border-[#e5e5e5] bg-[#f5f5f5] p-1 shadow-xs",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cx(
              "relative flex items-center gap-2 rounded-full font-medium transition-colors select-none cursor-pointer outline-none",
              size === "sm" ? "px-3.5 py-1.5 text-xs" : "px-4.5 py-2 text-xs sm:text-sm",
              isActive ? "text-[#0a0a0a]" : "text-[#6b6b6b] hover:text-[#0a0a0a]"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeTabPill"
                transition={{ type: "spring", stiffness: 450, damping: 30 }}
                className="absolute inset-0 rounded-full bg-white border border-[#e5e5e5] shadow-xs"
              />
            )}

            <span className="relative z-10 flex items-center gap-1.5">
              {tab.icon && <span className="h-3.5 w-3.5">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={cx(
                    "rounded-full px-1.5 py-0.2 text-[11px] font-mono",
                    isActive
                      ? "bg-[#0a0a0a] text-white"
                      : "bg-[#e5e5e5] text-[#6b6b6b]"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ================================================================== */
/* Status Text — Plain colored text (NO badges, NO dots)               */
/* ================================================================== */

export type StatusVariant =
  | "ok"
  | "warn"
  | "err"
  | "info"
  | "muted";

export interface StatusTextProps {
  children: ReactNode;
  variant?: StatusVariant;
  className?: string;
}

export function StatusText({
  children,
  variant = "muted",
  className,
}: StatusTextProps) {
  const variantColors: Record<StatusVariant, string> = {
    ok: "text-emerald-600 font-medium",
    warn: "text-amber-600 font-medium",
    err: "text-red-600 font-medium",
    info: "text-blue-600 font-medium",
    muted: "text-[#6b6b6b]",
  };

  return (
    <span className={cx("text-xs sm:text-sm inline-block", variantColors[variant], className)}>
      {children}
    </span>
  );
}
