import { type ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { cx } from "./styles";

export interface StatCardGlassProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    trend: "up" | "down" | "neutral";
    label?: string;
  };
  icon?: ReactNode;
  chartData?: number[];
  className?: string;
  onClick?: () => void;
}

export function StatCardGlass({
  title,
  value,
  change,
  icon,
  chartData = [12, 18, 15, 25, 22, 34, 42, 38, 55],
  className,
  onClick,
}: StatCardGlassProps) {
  // Generate SVG path from chart data
  const min = Math.min(...chartData);
  const max = Math.max(...chartData);
  const range = max - min || 1;
  const width = 100;
  const height = 32;
  const points = chartData
    .map((val, idx) => {
      const x = (idx / (chartData.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <GlassCard
      interactive={!!onClick}
      className={cx("p-5 flex flex-col justify-between min-h-[136px] bg-white border-[#e5e5e5]", className)}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-normal text-[#6b6b6b]">{title}</span>
          <div className="mt-1.5 text-2xl sm:text-3xl font-semibold tracking-tight text-[#0a0a0a]">
            {value}
          </div>
        </div>

        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#0a0a0a] text-white">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-end justify-between gap-2 pt-1">
        {change ? (
          <div className="flex items-center gap-1.5 text-xs">
            {/* Plain colored text — NO badge background, NO dot */}
            <span
              className={cx(
                "inline-flex items-center gap-0.5 font-medium",
                change.trend === "up" && "text-emerald-600",
                change.trend === "down" && "text-red-600",
                change.trend === "neutral" && "text-[#6b6b6b]"
              )}
            >
              {change.trend === "up" && <TrendingUp className="h-3.5 w-3.5 stroke-[2.5]" />}
              {change.trend === "down" && <TrendingDown className="h-3.5 w-3.5 stroke-[2.5]" />}
              {change.trend === "neutral" && <Minus className="h-3.5 w-3.5 stroke-[2.5]" />}
              {change.value}
            </span>
            {change.label && <span className="text-[#6b6b6b]">{change.label}</span>}
          </div>
        ) : (
          <div />
        )}

        {/* Sparkline chart */}
        <div className="h-8 w-24 shrink-0 overflow-visible opacity-75 group-hover:opacity-100 transition-opacity">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
            <polyline
              fill="none"
              stroke="#0a0a0a"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>
        </div>
      </div>
    </GlassCard>
  );
}
