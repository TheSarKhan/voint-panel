import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";
import { cx } from "./styles";

export interface LiquidAudioOrbProps {
  isActive?: boolean;
  size?: "sm" | "md" | "lg";
  label?: string;
  onClick?: () => void;
  className?: string;
}

export function LiquidAudioOrb({
  isActive = false,
  size = "md",
  label,
  onClick,
  className,
}: LiquidAudioOrbProps) {
  const sizeDimensions = {
    sm: "h-20 w-20",
    md: "h-32 w-32",
    lg: "h-44 w-44",
  };

  return (
    <div className={cx("flex flex-col items-center justify-center select-none", className)}>
      <div
        onClick={onClick}
        className={cx(
          "relative flex items-center justify-center cursor-pointer group",
          sizeDimensions[size]
        )}
      >
        {/* Outer Organic Rippling Ring 1 */}
        {isActive && (
          <motion.div
            animate={{
              scale: [1, 1.35, 1],
              opacity: [0.35, 0, 0.35],
              borderRadius: [
                "48% 52% 60% 40% / 50% 46% 54% 50%",
                "58% 42% 48% 52% / 44% 56% 44% 56%",
                "48% 52% 60% 40% / 50% 46% 54% 50%",
              ],
            }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-[#0a0a0a]/10 border border-[#0a0a0a]/20"
          />
        )}

        {/* Outer Organic Rippling Ring 2 */}
        {isActive && (
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.1, 0.5],
              borderRadius: [
                "40% 60% 50% 50% / 55% 45% 55% 45%",
                "52% 48% 58% 42% / 48% 52% 48% 52%",
                "40% 60% 50% 50% / 55% 45% 55% 45%",
              ],
            }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            className="absolute inset-2 bg-[#0a0a0a]/15 border border-[#0a0a0a]/25"
          />
        )}

        {/* Main Fluid Morphing Core Orb */}
        <motion.div
          animate={
            isActive
              ? {
                  scale: [0.98, 1.05, 0.98],
                  borderRadius: [
                    "46% 54% 52% 48% / 52% 48% 52% 48%",
                    "54% 46% 42% 58% / 46% 54% 46% 54%",
                    "48% 52% 58% 42% / 54% 46% 54% 46%",
                    "46% 54% 52% 48% / 52% 48% 52% 48%",
                  ],
                }
              : {
                  scale: 1,
                  borderRadius: "50%",
                }
          }
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
          className={cx(
            "relative flex items-center justify-center h-full w-full shadow-lg transition-colors duration-300",
            isActive
              ? "bg-[#0a0a0a] text-white shadow-xl"
              : "bg-[#0a0a0a] text-white hover:bg-black/90"
          )}
        >
          {/* Subtle reflection on top of the orb */}
          <div className="absolute top-1 inset-x-3 h-1/3 rounded-full bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />

          {/* Central Animated Equalizer Icon / Volume */}
          <div className="relative z-10 flex items-center gap-1">
            {isActive ? (
              <div className="flex items-center gap-1 h-6">
                {[12, 22, 16, 26, 14].map((h, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      height: [h * 0.4, h, h * 0.4],
                    }}
                    transition={{
                      duration: 0.6 + i * 0.1,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="w-1 rounded-full bg-white"
                  />
                ))}
              </div>
            ) : (
              <Volume2 className="h-6 w-6 text-white" />
            )}
          </div>
        </motion.div>
      </div>

      {label && (
        <span className="mt-3 text-xs font-medium text-[#6b6b6b] text-center">
          {label}
        </span>
      )}
    </div>
  );
}
