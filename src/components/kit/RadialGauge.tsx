import { motion } from "framer-motion";
import { cx } from "./styles";

export interface RadialGaugeProps {
  value: number; // 0 to 100
  size?: number; // width/height in px
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  color?: string;
  className?: string;
}

export function RadialGauge({
  value,
  size = 120,
  strokeWidth = 9,
  label,
  sublabel,
  color = "#0a0a0a",
  className,
}: RadialGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedValue = Math.min(100, Math.max(0, value));
  const strokeDashoffset = circumference - (normalizedValue / 100) * circumference;

  return (
    <div className={cx("flex flex-col items-center justify-center text-center", className)}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background Track Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e5e5"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Animated Value Arc Circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Center Percentage Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold tracking-tight text-[#0a0a0a] font-mono">
            {Math.round(normalizedValue)}%
          </span>
          {sublabel && (
            <span className="text-[10px] text-[#6b6b6b] mt-0.5">
              {sublabel}
            </span>
          )}
        </div>
      </div>

      {label && (
        <span className="mt-2.5 text-xs font-medium text-[#0a0a0a]">
          {label}
        </span>
      )}
    </div>
  );
}
