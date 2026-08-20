import { useRef, useState, type MouseEvent, type ReactNode, type HTMLAttributes } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";
import { cx } from "./styles";

export interface SpotlightCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  tilt?: boolean;
  className?: string;
}

export function SpotlightCard({
  children,
  tilt = true,
  className,
  ...props
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse position inside card for radial spotlight
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // 3D Tilt Spring Values
  const rotateXValue = useMotionValue(0);
  const rotateYValue = useMotionValue(0);

  const rotateX = useSpring(rotateXValue, { stiffness: 300, damping: 20 });
  const rotateY = useSpring(rotateYValue, { stiffness: 300, damping: 20 });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    mouseX.set(x);
    mouseY.set(y);

    if (tilt) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      // Tilt range: -8 to +8 degrees
      const rotY = ((x - centerX) / centerX) * 8;
      const rotX = -((y - centerY) / centerY) * 8;

      rotateXValue.set(rotX);
      rotateYValue.set(rotY);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    rotateXValue.set(0);
    rotateYValue.set(0);
  };

  return (
    <div style={{ perspective: 1000 }} className="relative">
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className={cx(
          "relative overflow-hidden rounded-3xl border border-[#e5e5e5] bg-white/95 p-6 shadow-sm transition-all duration-300",
          "hover:border-[#0a0a0a]/30 hover:shadow-xl",
          className
        )}
        {...(props as any)}
      >
        {/* Dynamic Radial Spotlight reflection following mouse cursor */}
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-300"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(400px circle at ${mouseX.get()}px ${mouseY.get()}px, rgba(10, 10, 10, 0.06), transparent 80%)`,
          }}
        />

        {/* Surface Inner Bevel / Sheen */}
        <div className="pointer-events-none absolute inset-0 rounded-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,1)]" />

        <div className="relative z-10" style={{ transform: "translateZ(10px)" }}>
          {children}
        </div>
      </motion.div>
    </div>
  );
}
