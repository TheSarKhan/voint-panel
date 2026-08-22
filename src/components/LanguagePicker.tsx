import { IconCheck } from "./icons";

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  description: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: "az",
    name: "Azərbaycan dili",
    nativeName: "Azərbaycanca",
    flag: "🇦🇿",
    description: "Əsas regional dil, Azərbaycan üzrə standart zənglər üçün",
  },
  {
    code: "ru",
    name: "Rus dili",
    nativeName: "Русский",
    flag: "🇷🇺",
    description: "Zəng edən rusca danışdıqda agent dərhal rus dilinə keçir",
  },
  {
    code: "en",
    name: "İngilis dili",
    nativeName: "English",
    flag: "🇬🇧",
    description: "Xarici və beynəlxalq zənglər üçün ingilis dili dəstəyi",
  },
  {
    code: "tr",
    name: "Türk dili",
    nativeName: "Türkçe",
    flag: "🇹🇷",
    description: "Türkiyə və ortaq türk dilli zəng edənlər üçün keçid",
  },
];

export interface ParsedLanguages {
  def: string;
  supported: string[];
  extra: Record<string, unknown>;
  broken: boolean;
}

export function parseLanguages(raw: string | null | undefined): ParsedLanguages {
  if (!raw || !raw.trim()) {
    return { def: "az", supported: ["az"], extra: {}, broken: false };
  }
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const { default: def, supported, ...extra } = parsed;
    const defLang = typeof def === "string" && def.trim() ? def.trim() : "az";
    const supportedList = Array.isArray(supported)
      ? supported.filter((s): s is string => typeof s === "string" && s.trim().length > 0)
      : [defLang];

    return {
      def: defLang,
      supported: supportedList.includes(defLang) ? supportedList : [defLang, ...supportedList],
      extra,
      broken: false,
    };
  } catch {
    // Əgər dəyər sadə mətn şəklindədirsə (məsələn sadəcə "az")
    const clean = raw.trim();
    if (/^[a-z]{2}(-[A-Z]{2})?$/.test(clean)) {
      return { def: clean, supported: [clean], extra: {}, broken: false };
    }
    return { def: "az", supported: ["az"], extra: {}, broken: true };
  }
}

export function serializeLanguages(
  defLang: string,
  supported: string[],
  extra: Record<string, unknown> = {},
): string {
  const langs = supported.includes(defLang) ? supported : [defLang, ...supported];
  return JSON.stringify({ ...extra, default: defLang, supported: langs });
}

interface LanguagePickerProps {
  value: string;
  onChange: (serialized: string) => void;
}

export function LanguagePicker({ value, onChange }: LanguagePickerProps) {
  const parsed = parseLanguages(value);
  const { def: defLang, supported, extra, broken } = parsed;

  const handleDefLangChange = (newDef: string) => {
    const nextSupported = supported.includes(newDef) ? supported : [...supported, newDef];
    onChange(serializeLanguages(newDef, nextSupported, extra));
  };

  const handleToggleSupported = (code: string) => {
    if (code === defLang) return; // Əsas dil həmişə dəstəklənən qalmalıdır
    const nextSupported = supported.includes(code)
      ? supported.filter((c) => c !== code)
      : [...supported, code];
    onChange(serializeLanguages(defLang, nextSupported, extra));
  };

  return (
    <div className="space-y-6 rounded-lg border border-border bg-surface-2/40 p-5">
      {broken && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
          Qeyd: Əvvəlki dil parametri standart formatda deyildi, avtomatik bərpa olundu.
        </div>
      )}

      {/* 1. Əsas dil seçimi */}
      <div>
        <div className="mb-2.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-fg-muted">
            Əsas Danışıq Dili (Qarşılama Dili)
          </label>
          <p className="mt-0.5 text-xs text-fg-faint">
            Agent zəngi qaldırdıqda ilk salamlama və standart cavablar bu dildə səsləndirilir.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = defLang === lang.code;
            return (
              <button
                key={`def-${lang.code}`}
                type="button"
                onClick={() => handleDefLangChange(lang.code)}
                className={`flex flex-col items-start rounded-lg border p-3.5 text-left transition-all ${
                  isSelected
                    ? "border-fg bg-surface shadow-xs ring-1 ring-fg"
                    : "border-border bg-surface hover:border-border-strong hover:bg-surface-2"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-xl" role="img" aria-label={lang.name}>
                    {lang.flag}
                  </span>
                  {isSelected && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-fg text-surface">
                      <IconCheck width={11} height={11} />
                    </span>
                  )}
                </div>
                <span className="mt-2 text-sm font-medium text-fg">{lang.nativeName}</span>
                <span className="text-xs text-fg-muted">{lang.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Çoxdillilik və Avtomatik Dil Keçidi */}
      <div className="border-t border-border/80 pt-5">
        <div className="mb-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-fg-muted">
            Zəng Zamanı Dəstəklənən Əlavə Dillər
          </label>
          <p className="mt-0.5 text-xs text-fg-faint">
            Zəng edən şəxs fərqli dildə danışarsa, AI agentinin avtomatik olaraq həmin dilə keçməsinə icazə verin.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isPrimary = lang.code === defLang;
            const isChecked = isPrimary || supported.includes(lang.code);

            return (
              <label
                key={`sup-${lang.code}`}
                className={`flex cursor-pointer select-none items-start gap-3 rounded-lg border p-3.5 transition-all ${
                  isPrimary
                    ? "border-border bg-surface-2/60 opacity-90 cursor-default"
                    : isChecked
                    ? "border-border-strong bg-surface"
                    : "border-border/60 bg-surface/50 hover:border-border hover:bg-surface"
                }`}
              >
                <div className="pt-0.5">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={isPrimary}
                    onChange={() => handleToggleSupported(lang.code)}
                    className="h-4 w-4 rounded-xs border-border-strong accent-fg"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{lang.flag}</span>
                    <span className="text-sm font-medium text-fg">{lang.nativeName}</span>
                    {isPrimary && (
                      <span className="text-xs font-medium text-fg-muted">
                        (Əsas dil — həmişə aktivdir)
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-fg-muted leading-relaxed">
                    {lang.description}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
