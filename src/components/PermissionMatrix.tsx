import { useEffect, useRef } from "react";
import type { PermissionCatalog } from "../api/roles";
import { Table, TableContainer, TBody, TD, TH, THead, TR } from "./ui";

/**
 * Modulun bütün icazələrini birdən verən xana.
 *
 * "Yarımçıq" vəziyyəti HTML-də yalnız JS ilə qoyulur, ona görə ref lazımdır. Onsuz iki fərqli
 * hal — "heç biri seçilməyib" və "bir neçəsi seçilib" — eyni boş xana kimi görünür.
 */
function ModuleCheckbox({
  granted,
  total,
  disabled,
  label,
  onToggle,
}: {
  granted: number;
  total: number;
  disabled: boolean;
  label: string;
  onToggle: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = granted > 0 && granted < total;
    }
  }, [granted, total]);

  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label={`${label} — bütün icazələr`}
      checked={granted === total && total > 0}
      disabled={disabled}
      onChange={onToggle}
      className="h-4 w-4 shrink-0 cursor-pointer accent-accent disabled:cursor-not-allowed"
    />
  );
}

/**
 * Rol × resurs × əməliyyat matrisi.
 *
 * Sətir = resurs, sütun = əməliyyat. Xanaya toxunmaq icazəni verir və ya alır. Yalnız VERİLƏN
 * icazələr saxlanılır — xananın boş olması "qadağandır" deməkdir. Katalog artıq backend
 * tərəfindən bu müəssisəyə aid resurslara filtrlənib gəlir (platforma resursları heç görünmür).
 */
export function PermissionMatrix({
  catalog,
  value,
  onChange,
  disabled = false,
}: {
  catalog: PermissionCatalog;
  value: Record<string, string[]>;
  onChange: (next: Record<string, string[]>) => void;
  disabled?: boolean;
}) {
  const has = (resource: string, action: string) => (value[resource] ?? []).includes(action);

  const toggle = (resource: string, action: string) => {
    if (disabled) return;
    const current = value[resource] ?? [];
    const next = current.includes(action)
      ? current.filter((a) => a !== action)
      : [...current, action];
    const copy = { ...value };
    if (next.length === 0) delete copy[resource];
    else copy[resource] = next;
    onChange(copy);
  };

  const rowAll = (resource: string) => {
    if (disabled) return;
    const all = catalog.actions.map((a) => a.value);
    const copy = { ...value };
    if ((value[resource] ?? []).length === all.length) delete copy[resource];
    else copy[resource] = all;
    onChange(copy);
  };

  return (
    <div className="rounded-md border border-border bg-surface">
      <TableContainer>
        <Table>
          <THead>
            <TH className="sticky left-0 z-10 bg-surface">Resurs</TH>
            {catalog.actions.map((a) => (
              <TH key={a.value} className="text-center">
                {a.label}
              </TH>
            ))}
          </THead>
          <TBody>
            {catalog.resources.map((r) => {
              const granted = value[r.value] ?? [];
              return (
                <TR key={r.value}>
                  <TD className="sticky left-0 z-10 whitespace-nowrap bg-surface font-medium text-fg">
                    <label className="flex cursor-pointer items-center gap-2.5">
                      <ModuleCheckbox
                        granted={granted.length}
                        total={catalog.actions.length}
                        disabled={disabled}
                        label={r.label}
                        onToggle={() => rowAll(r.value)}
                      />
                      <span>{r.label}</span>
                    </label>
                  </TD>
                  {catalog.actions.map((a) => {
                    const isDirectExec = r.value === "APPROVAL" && a.value === "CREATE";
                    return (
                      <TD key={a.value} className="text-center">
                        <div className="inline-flex flex-col items-center">
                          <input
                            type="checkbox"
                            aria-label={`${r.label}, ${a.label}`}
                            checked={has(r.value, a.value)}
                            disabled={disabled}
                            onChange={() => toggle(r.value, a.value)}
                            className={`h-4 w-4 cursor-pointer disabled:cursor-not-allowed ${
                              isDirectExec ? "accent-[#39ff14]" : "accent-accent"
                            }`}
                          />
                          {isDirectExec && (
                            <span className="mt-0.5 text-[9px] font-medium text-emerald-600">
                              (Təsdiqsiz)
                            </span>
                          )}
                        </div>
                      </TD>
                    );
                  })}
                  <TD className="text-right">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => rowAll(r.value)}
                      className="text-xs text-fg-muted transition-colors hover:text-fg disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {granted.length === catalog.actions.length ? "təmizlə" : "seç"}
                    </button>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      </TableContainer>
    </div>
  );
}
