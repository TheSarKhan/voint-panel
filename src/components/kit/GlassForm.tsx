import {
  forwardRef,
  useState,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
} from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, ChevronDown } from "lucide-react";
import { cx } from "./styles";

/* ================================================================== */
/* Clean Light Input                                                  */
/* ================================================================== */

export interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  isPassword?: boolean;
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      isPassword = false,
      type = "text",
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-xs font-medium text-[#0a0a0a]">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3.5 flex items-center text-[#6b6b6b]">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            type={inputType}
            disabled={disabled}
            className={cx(
              "h-10 w-full rounded-xl border bg-white px-3.5 text-sm text-[#0a0a0a] placeholder:text-[#6b6b6b]",
              "border-[#e5e5e5] transition-all duration-150",
              "focus:border-[#0a0a0a] focus:outline-none focus:ring-1 focus:ring-[#0a0a0a]",
              "hover:border-[#a3a3a3]",
              error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "",
              leftIcon ? "pl-10" : "",
              (rightIcon || isPassword) ? "pr-10" : "",
              disabled ? "cursor-not-allowed opacity-50 bg-[#f5f5f5]" : "",
              className
            )}
            {...props}
          />

          {isPassword ? (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 text-[#6b6b6b] hover:text-[#0a0a0a] transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          ) : (
            rightIcon && <div className="absolute right-3.5 text-[#6b6b6b]">{rightIcon}</div>
          )}
        </div>

        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        {!error && helperText && (
          <p className="mt-1 text-xs text-[#6b6b6b]">{helperText}</p>
        )}
      </div>
    );
  }
);
GlassInput.displayName = "GlassInput";

/* ================================================================== */
/* Clean Light Select                                                 */
/* ================================================================== */

export interface GlassSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
}

export const GlassSelect = forwardRef<HTMLSelectElement, GlassSelectProps>(
  ({ label, error, helperText, leftIcon, children, className, disabled, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-xs font-medium text-[#0a0a0a]">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3.5 flex items-center text-[#6b6b6b]">
              {leftIcon}
            </div>
          )}

          <select
            ref={ref}
            disabled={disabled}
            className={cx(
              "h-10 w-full appearance-none rounded-xl border bg-white px-3.5 text-sm text-[#0a0a0a]",
              "border-[#e5e5e5] transition-all duration-150 pr-10",
              "focus:border-[#0a0a0a] focus:outline-none focus:ring-1 focus:ring-[#0a0a0a]",
              "hover:border-[#a3a3a3] cursor-pointer",
              error ? "border-red-500" : "",
              leftIcon ? "pl-10" : "",
              disabled ? "cursor-not-allowed opacity-50 bg-[#f5f5f5]" : "",
              className
            )}
            {...props}
          >
            {children}
          </select>

          <ChevronDown className="pointer-events-none absolute right-3.5 h-4 w-4 text-[#6b6b6b]" />
        </div>

        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        {!error && helperText && <p className="mt-1 text-xs text-[#6b6b6b]">{helperText}</p>}
      </div>
    );
  }
);
GlassSelect.displayName = "GlassSelect";

/* ================================================================== */
/* Clean Switch / Toggle                                              */
/* ================================================================== */

export interface GlassSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  size?: "sm" | "md";
}

export function GlassSwitch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = "md",
}: GlassSwitchProps) {
  const isSm = size === "sm";

  return (
    <label
      className={cx(
        "inline-flex items-center gap-3 select-none cursor-pointer",
        disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx(
          "relative inline-flex shrink-0 cursor-pointer rounded-full border transition-all duration-200 outline-none",
          isSm ? "h-5 w-9" : "h-6 w-11",
          checked
            ? "bg-[#0a0a0a] border-[#0a0a0a]"
            : "bg-[#e5e5e5] border-[#e5e5e5] hover:border-[#a3a3a3]"
        )}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={cx(
            "pointer-events-none inline-block rounded-full bg-white shadow-xs transform",
            isSm ? "h-4 w-4 my-auto" : "h-5 w-5 my-auto",
            checked
              ? (isSm ? "translate-x-4 bg-white" : "translate-x-5 bg-white")
              : "translate-x-0.5 bg-white"
          )}
        />
      </button>

      {(label || description) && (
        <div className="flex flex-col">
          {label && <span className="text-xs sm:text-sm font-medium text-[#0a0a0a]">{label}</span>}
          {description && <span className="text-xs text-[#6b6b6b]">{description}</span>}
        </div>
      )}
    </label>
  );
}

/* ================================================================== */
/* Clean Textarea                                                     */
/* ================================================================== */

export interface GlassTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const GlassTextarea = forwardRef<HTMLTextAreaElement, GlassTextareaProps>(
  ({ label, error, helperText, className, disabled, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-xs font-medium text-[#0a0a0a]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          disabled={disabled}
          className={cx(
            "w-full rounded-xl border bg-white p-3 text-sm text-[#0a0a0a] placeholder:text-[#6b6b6b]",
            "border-[#e5e5e5] transition-all duration-150",
            "focus:border-[#0a0a0a] focus:outline-none focus:ring-1 focus:ring-[#0a0a0a]",
            "hover:border-[#a3a3a3]",
            error ? "border-red-500" : "",
            disabled ? "cursor-not-allowed opacity-50 bg-[#f5f5f5]" : "",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        {!error && helperText && <p className="mt-1 text-xs text-[#6b6b6b]">{helperText}</p>}
      </div>
    );
  }
);
GlassTextarea.displayName = "GlassTextarea";
