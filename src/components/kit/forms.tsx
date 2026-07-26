/**
 * Voint UI kit — form idareedicileri.
 * Her bir komponent: etiket, mecburi nisani, komekci metn, sehv mesaji,
 * deaktiv hal ve aydin klaviatura fokusunu destekleyir.
 */
import {
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentType,
  type DragEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type SVGProps,
  type TextareaHTMLAttributes,
} from "react";
import {
  IconCheck,
  IconChevronDown,
  IconClose,
  IconEye,
  IconEyeOff,
  IconMinus,
  IconPlus,
  IconSearch,
  IconUpload,
} from "../icons";
import { cx, focusRing, inputCls, inputErrorCls } from "./styles";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

/* ================================================================== */
/* Etiket / komekci metn / sehv                                        */
/* ================================================================== */

export function Label({
  htmlFor,
  required,
  children,
  className = "",
}: {
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cx(
        "mb-1.5 block text-xs font-medium uppercase tracking-wide text-fg-muted",
        className,
      )}
    >
      {children}
      {required && (
        <span className="ml-1 text-err" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}

export function HelpText({
  id,
  children,
}: {
  id?: string;
  children: ReactNode;
}) {
  return (
    <p id={id} className="mt-1.5 text-xs text-fg-faint">
      {children}
    </p>
  );
}

export function ErrorText({
  id,
  children,
}: {
  id?: string;
  children: ReactNode;
}) {
  return (
    <p id={id} className="mt-1.5 text-xs text-err">
      {children}
    </p>
  );
}

/* ================================================================== */
/* Field — kohne API (label + children) ile uyumludur                   */
/* ================================================================== */

export function Field({
  label,
  children,
  htmlFor,
  required,
  help,
  error,
  className = "",
}: {
  label: string;
  children: ReactNode;
  htmlFor?: string;
  required?: boolean;
  help?: string;
  error?: string;
  className?: string;
}) {
  const content = (
    <>
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-fg-muted">
        {label}
        {required && (
          <span className="ml-1 text-err" aria-hidden="true">
            *
          </span>
        )}
      </span>
      {children}
      {help && !error && <HelpText>{help}</HelpText>}
      {error && <ErrorText>{error}</ErrorText>}
    </>
  );

  if (htmlFor) {
    return (
      <div className={cx("block", className)}>
        <label htmlFor={htmlFor}>{content}</label>
      </div>
    );
  }
  return <label className={cx("block", className)}>{content}</label>;
}

/** Sahələri sütunlara bölən sətir. */
export function FormRow({
  children,
  columns = 2,
  className = "",
}: {
  children: ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  const cols =
    columns === 1
      ? "grid-cols-1"
      : columns === 3
        ? "grid-cols-1 sm:grid-cols-3"
        : "grid-cols-1 sm:grid-cols-2";
  return <div className={cx("grid gap-4", cols, className)}>{children}</div>;
}

/** Başlıqlı sahə qrupu. */
export function FieldGroup({
  legend,
  description,
  children,
  className = "",
}: {
  legend?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={cx("min-w-0", className)}>
      {legend && (
        <legend className="mb-1 text-sm font-medium text-fg">{legend}</legend>
      )}
      {description && (
        <p className="mb-3 text-xs text-fg-muted">{description}</p>
      )}
      <div className="space-y-3">{children}</div>
    </fieldset>
  );
}

/* ================================================================== */
/* Input                                                               */
/* ================================================================== */

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  help?: string;
  error?: string;
  icon?: IconComponent;
  /** type="password" ucun goster/gizlet duymesi. */
  revealable?: boolean;
  containerClassName?: string;
}

export function Input({
  label,
  help,
  error,
  icon: Icon,
  revealable = false,
  required,
  disabled,
  className = "",
  containerClassName = "",
  id,
  type = "text",
  ...rest
}: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const helpId = `${inputId}-help`;
  const errId = `${inputId}-err`;
  const [revealed, setRevealed] = useState(false);

  const isPassword = type === "password";
  const effectiveType = isPassword && revealed ? "text" : type;
  const describedBy =
    [error ? errId : null, help ? helpId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className={cx("block", containerClassName)}>
      {label && (
        <Label htmlFor={inputId} required={required}>
          {label}
        </Label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            width={15}
            height={15}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-faint"
          />
        )}
        <input
          id={inputId}
          type={effectiveType}
          required={required}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cx(
            inputCls,
            Icon && "pl-9",
            isPassword && revealable && "pr-10",
            error && inputErrorCls,
            className,
          )}
          {...rest}
        />
        {isPassword && revealable && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? "Şifrəni gizlət" : "Şifrəni göstər"}
            className={cx(
              "absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1.5 text-fg-faint transition-colors hover:text-fg",
              focusRing,
            )}
          >
            {revealed ? (
              <IconEyeOff width={15} height={15} />
            ) : (
              <IconEye width={15} height={15} />
            )}
          </button>
        )}
      </div>
      {help && !error && <HelpText id={helpId}>{help}</HelpText>}
      {error && <ErrorText id={errId}>{error}</ErrorText>}
    </div>
  );
}

/* ================================================================== */
/* Textarea                                                            */
/* ================================================================== */

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  help?: string;
  error?: string;
  /** maxLength ile birlikde simvol sayğacını gosterir. */
  showCount?: boolean;
  containerClassName?: string;
}

export function Textarea({
  label,
  help,
  error,
  showCount = false,
  required,
  className = "",
  containerClassName = "",
  id,
  rows = 4,
  maxLength,
  value,
  ...rest
}: TextareaProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const helpId = `${fieldId}-help`;
  const errId = `${fieldId}-err`;
  const length = typeof value === "string" ? value.length : 0;
  const describedBy =
    [error ? errId : null, help ? helpId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className={cx("block", containerClassName)}>
      {label && (
        <Label htmlFor={fieldId} required={required}>
          {label}
        </Label>
      )}
      <textarea
        id={fieldId}
        rows={rows}
        required={required}
        maxLength={maxLength}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cx(inputCls, "resize-y", error && inputErrorCls, className)}
        {...rest}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {help && !error && <HelpText id={helpId}>{help}</HelpText>}
          {error && <ErrorText id={errId}>{error}</ErrorText>}
        </div>
        {showCount && maxLength !== undefined && (
          <span className="mt-1.5 shrink-0 text-xs text-fg-faint tabular-nums">
            {length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/* Select                                                              */
/* ================================================================== */

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  help?: string;
  error?: string;
  options?: SelectOption[];
  placeholder?: string;
  containerClassName?: string;
}

export function Select({
  label,
  help,
  error,
  options,
  placeholder,
  required,
  className = "",
  containerClassName = "",
  id,
  children,
  ...rest
}: SelectProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const helpId = `${fieldId}-help`;
  const errId = `${fieldId}-err`;
  const describedBy =
    [error ? errId : null, help ? helpId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className={cx("block", containerClassName)}>
      {label && (
        <Label htmlFor={fieldId} required={required}>
          {label}
        </Label>
      )}
      <div className="relative">
        <select
          id={fieldId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cx(
            inputCls,
            "appearance-none pr-9 [color-scheme:dark]",
            error && inputErrorCls,
            className,
          )}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options?.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
          {children}
        </select>
        <IconChevronDown
          width={15}
          height={15}
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-fg-faint"
        />
      </div>
      {help && !error && <HelpText id={helpId}>{help}</HelpText>}
      {error && <ErrorText id={errId}>{error}</ErrorText>}
    </div>
  );
}

/* ================================================================== */
/* Checkbox / Radio                                                    */
/* ================================================================== */

const controlBoxCls =
  "flex h-4 w-4 shrink-0 items-center justify-center border border-border-strong bg-surface-2 text-transparent transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-fg-muted peer-disabled:opacity-40";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
  description?: string;
}

export function Checkbox({
  label,
  description,
  className = "",
  disabled,
  ...rest
}: CheckboxProps) {
  return (
    <label
      className={cx(
        "flex items-start gap-2.5",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        className,
      )}
    >
      <span className="relative mt-0.5 inline-flex">
        <input type="checkbox" className="peer sr-only" disabled={disabled} {...rest} />
        <span
          aria-hidden="true"
          className={cx(
            controlBoxCls,
            "rounded-[3px] peer-checked:border-accent peer-checked:bg-accent peer-checked:text-accent-fg",
          )}
        >
          <IconCheck width={11} height={11} strokeWidth={3} />
        </span>
      </span>
      <span className="min-w-0">
        <span className="block text-sm text-fg">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-fg-muted">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}

export interface CheckboxGroupOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export function CheckboxGroup({
  legend,
  options,
  value,
  onChange,
  help,
  error,
  required,
  className = "",
}: {
  legend?: string;
  options: CheckboxGroupOption[];
  value: string[];
  onChange: (value: string[]) => void;
  help?: string;
  error?: string;
  required?: boolean;
  className?: string;
}) {
  const toggle = (v: string) => {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };
  return (
    <fieldset className={cx("min-w-0", className)}>
      {legend && (
        <legend className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-muted">
          {legend}
          {required && (
            <span className="ml-1 text-err" aria-hidden="true">
              *
            </span>
          )}
        </legend>
      )}
      <div className="space-y-2.5">
        {options.map((o) => (
          <Checkbox
            key={o.value}
            label={o.label}
            description={o.description}
            disabled={o.disabled}
            checked={value.includes(o.value)}
            onChange={() => toggle(o.value)}
          />
        ))}
      </div>
      {help && !error && <HelpText>{help}</HelpText>}
      {error && <ErrorText>{error}</ErrorText>}
    </fieldset>
  );
}

export interface RadioProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
  description?: string;
}

export function Radio({
  label,
  description,
  className = "",
  disabled,
  ...rest
}: RadioProps) {
  return (
    <label
      className={cx(
        "flex items-start gap-2.5",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        className,
      )}
    >
      <span className="relative mt-0.5 inline-flex">
        <input type="radio" className="peer sr-only" disabled={disabled} {...rest} />
        <span
          aria-hidden="true"
          className={cx(
            controlBoxCls,
            "rounded-full peer-checked:border-accent peer-checked:text-accent",
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      </span>
      <span className="min-w-0">
        <span className="block text-sm text-fg">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-fg-muted">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}

export function RadioGroup({
  legend,
  name,
  options,
  value,
  onChange,
  help,
  error,
  required,
  className = "",
}: {
  legend?: string;
  name: string;
  options: CheckboxGroupOption[];
  value: string;
  onChange: (value: string) => void;
  help?: string;
  error?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <fieldset className={cx("min-w-0", className)}>
      {legend && (
        <legend className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-muted">
          {legend}
          {required && (
            <span className="ml-1 text-err" aria-hidden="true">
              *
            </span>
          )}
        </legend>
      )}
      <div className="space-y-2.5">
        {options.map((o) => (
          <Radio
            key={o.value}
            name={name}
            label={o.label}
            description={o.description}
            disabled={o.disabled}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
          />
        ))}
      </div>
      {help && !error && <HelpText>{help}</HelpText>}
      {error && <ErrorText>{error}</ErrorText>}
    </fieldset>
  );
}

/* ================================================================== */
/* Switch — kvadrat, sade suruşme (prefers-reduced-motion nezere alinir) */
/* ================================================================== */

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
}) {
  const autoId = useId();
  const switchId = id ?? autoId;
  const labelId = `${switchId}-label`;

  const control = (
    <button
      type="button"
      id={switchId}
      role="switch"
      aria-checked={checked}
      aria-labelledby={label ? labelId : undefined}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        "relative h-5 w-9 shrink-0 rounded-[4px] border transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        checked
          ? "border-accent bg-accent"
          : "border-border-strong bg-surface-2",
        focusRing,
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          "absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-[2px] transition-[left]",
          checked ? "left-[18px] bg-accent-fg" : "left-[2px] bg-fg-faint",
        )}
      />
    </button>
  );

  if (!label) return control;

  return (
    <div className="flex items-start gap-3">
      {control}
      <div className="min-w-0">
        <label
          id={labelId}
          htmlFor={switchId}
          className={cx(
            "block text-sm text-fg",
            disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          )}
        >
          {label}
        </label>
        {description && (
          <p className="mt-0.5 text-xs text-fg-muted">{description}</p>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/* SearchInput                                                         */
/* ================================================================== */

export function SearchInput({
  value,
  onChange,
  placeholder = "Axtar…",
  label,
  className = "",
  disabled,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <div className={cx("block", className)}>
      {label && <Label htmlFor={fieldId}>{label}</Label>}
      <div className="relative">
        <IconSearch
          width={15}
          height={15}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-faint"
        />
        <input
          id={fieldId}
          type="search"
          role="searchbox"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={cx(
            inputCls,
            "pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden",
          )}
        />
        {value && !disabled && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Təmizlə"
            className={cx(
              "absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1.5 text-fg-faint transition-colors hover:text-fg",
              focusRing,
            )}
          >
            <IconClose width={14} height={14} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/* Tarix / saat                                                        */
/* ================================================================== */

export function DateInput(props: Omit<InputProps, "type">) {
  return (
    <Input
      {...props}
      type="date"
      className={cx("[color-scheme:dark]", props.className)}
    />
  );
}

export function TimeInput(props: Omit<InputProps, "type">) {
  return (
    <Input
      {...props}
      type="time"
      className={cx("[color-scheme:dark]", props.className)}
    />
  );
}

/* ================================================================== */
/* NumberInput                                                         */
/* ================================================================== */

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  steppers = true,
  label,
  help,
  error,
  required,
  disabled,
  placeholder,
  className = "",
  id,
}: {
  value: number | "";
  onChange: (value: number | "") => void;
  min?: number;
  max?: number;
  step?: number;
  steppers?: boolean;
  label?: string;
  help?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
}) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const helpId = `${fieldId}-help`;
  const errId = `${fieldId}-err`;

  const clamp = (n: number) => {
    let out = n;
    if (min !== undefined) out = Math.max(min, out);
    if (max !== undefined) out = Math.min(max, out);
    return out;
  };

  const bump = (delta: number) => {
    const current = value === "" ? 0 : value;
    onChange(clamp(Number((current + delta).toFixed(6))));
  };

  const stepBtn =
    "flex h-[38px] w-9 items-center justify-center text-fg-muted transition-colors hover:text-fg disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className={cx("block", className)}>
      {label && (
        <Label htmlFor={fieldId} required={required}>
          {label}
        </Label>
      )}
      <div
        className={cx(
          "flex items-stretch overflow-hidden rounded-md border border-border bg-surface-2 transition-colors focus-within:border-border-strong",
          error && "border-err/60",
          disabled && "opacity-50",
        )}
      >
        {steppers && (
          <button
            type="button"
            onClick={() => bump(-step)}
            disabled={disabled || (min !== undefined && value !== "" && value <= min)}
            aria-label="Azalt"
            className={cx(stepBtn, "border-r border-border", focusRing)}
          >
            <IconMinus width={14} height={14} />
          </button>
        )}
        <input
          id={fieldId}
          type="number"
          inputMode="numeric"
          value={value}
          min={min}
          max={max}
          step={step}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            [error ? errId : null, help ? helpId : null]
              .filter(Boolean)
              .join(" ") || undefined
          }
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value;
            onChange(raw === "" ? "" : Number(raw));
          }}
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-center text-sm text-fg tabular-nums outline-none placeholder:text-fg-faint focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-fg-muted [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        {steppers && (
          <button
            type="button"
            onClick={() => bump(step)}
            disabled={disabled || (max !== undefined && value !== "" && value >= max)}
            aria-label="Artır"
            className={cx(stepBtn, "border-l border-border", focusRing)}
          >
            <IconPlus width={14} height={14} />
          </button>
        )}
      </div>
      {help && !error && <HelpText id={helpId}>{help}</HelpText>}
      {error && <ErrorText id={errId}>{error}</ErrorText>}
    </div>
  );
}

/* ================================================================== */
/* FileUpload — RAG toplu yukleme ucun                                 */
/* ================================================================== */

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUpload({
  files,
  onChange,
  label,
  help,
  error,
  accept,
  multiple = true,
  maxSizeMb,
  disabled = false,
  className = "",
  id,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  label?: string;
  help?: string;
  error?: string;
  accept?: string;
  multiple?: boolean;
  maxSizeMb?: number;
  disabled?: boolean;
  className?: string;
  id?: string;
}) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const accept_ = accept;

  const addFiles = (incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) return;
    const list = Array.from(incoming);
    if (maxSizeMb) {
      const tooBig = list.filter((f) => f.size > maxSizeMb * 1024 * 1024);
      if (tooBig.length > 0) {
        setLocalError(`Maksimum fayl ölçüsü ${maxSizeMb} MB-dır.`);
        return;
      }
    }
    setLocalError(null);
    onChange(multiple ? [...files, ...list] : list.slice(0, 1));
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    addFiles(e.dataTransfer.files);
  };

  const shownError = error ?? localError;

  return (
    <div className={cx("block", className)}>
      {label && <Label htmlFor={fieldId}>{label}</Label>}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cx(
          "flex flex-col items-center justify-center rounded-md border border-dashed px-6 py-8 text-center transition-colors",
          dragging ? "border-fg-muted bg-surface-2" : "border-border-strong",
          shownError && "border-err/60",
          disabled && "opacity-50",
        )}
      >
        <IconUpload
          width={20}
          height={20}
          aria-hidden="true"
          className="mb-2 text-fg-faint"
        />
        <p className="text-sm text-fg-muted">
          Faylları bura sürükləyin və ya
        </p>
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className={cx(
            "mt-2 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-fg transition-colors hover:border-border-strong disabled:cursor-not-allowed",
            focusRing,
          )}
        >
          Fayl seçin
        </button>
        <input
          ref={inputRef}
          id={fieldId}
          type="file"
          className="sr-only"
          accept={accept_}
          multiple={multiple}
          disabled={disabled}
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        {(accept_ || maxSizeMb) && (
          <p className="mt-2 text-xs text-fg-faint">
            {accept_ ? accept_ : ""}
            {accept_ && maxSizeMb ? " · " : ""}
            {maxSizeMb ? `maks. ${maxSizeMb} MB` : ""}
          </p>
        )}
      </div>

      {files.length > 0 && (
        <ul className="mt-3 divide-y divide-border rounded-md border border-border">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center justify-between gap-3 px-3 py-2"
            >
              <span className="min-w-0 truncate text-sm text-fg">{f.name}</span>
              <span className="flex shrink-0 items-center gap-3">
                <span className="text-xs text-fg-faint tabular-nums">
                  {formatBytes(f.size)}
                </span>
                <button
                  type="button"
                  onClick={() => onChange(files.filter((_, j) => j !== i))}
                  aria-label={`${f.name} faylını sil`}
                  className={cx(
                    "rounded p-1 text-fg-faint transition-colors hover:text-err",
                    focusRing,
                  )}
                >
                  <IconClose width={14} height={14} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {help && !shownError && <HelpText>{help}</HelpText>}
      {shownError && <ErrorText>{shownError}</ErrorText>}
    </div>
  );
}
