import {
  type ReactNode,
  type TableHTMLAttributes,
  type ThHTMLAttributes,
  type TdHTMLAttributes,
  type HTMLAttributes,
} from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { cx } from "./styles";

/* ================================================================== */
/* Clean Table Container                                              */
/* ================================================================== */

export function GlassTableContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "relative w-full overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white shadow-xs",
        className
      )}
    >
      <div className="w-full overflow-x-auto">{children}</div>
    </div>
  );
}

/* ================================================================== */
/* Clean Table                                                        */
/* ================================================================== */

export function GlassTable({
  children,
  className,
  ...props
}: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table
      className={cx("w-full text-left border-collapse text-sm", className)}
      {...props}
    >
      {children}
    </table>
  );
}

/* ================================================================== */
/* Table Head & Header Cell                                           */
/* ================================================================== */

export function GlassTHead({
  children,
  className,
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cx(
        "border-b border-[#e5e5e5] bg-[#fafafa] text-xs font-medium text-[#6b6b6b] select-none",
        className
      )}
    >
      {children}
    </thead>
  );
}

export interface GlassTHProps extends ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sortDirection?: "asc" | "desc" | null;
  onSort?: () => void;
  children: ReactNode;
}

export function GlassTH({
  sortable = false,
  sortDirection = null,
  onSort,
  children,
  className,
  ...props
}: GlassTHProps) {
  return (
    <th
      onClick={sortable ? onSort : undefined}
      className={cx(
        "py-3 px-4 text-xs font-medium text-[#6b6b6b] transition-colors",
        sortable ? "cursor-pointer hover:text-[#0a0a0a]" : "",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-1.5">
        <span>{children}</span>
        {sortable && (
          <span className="text-[#a3a3a3]">
            {sortDirection === "asc" ? (
              <ChevronUp className="h-3.5 w-3.5 text-[#0a0a0a]" />
            ) : sortDirection === "desc" ? (
              <ChevronDown className="h-3.5 w-3.5 text-[#0a0a0a]" />
            ) : (
              <ChevronsUpDown className="h-3.5 w-3.5" />
            )}
          </span>
        )}
      </div>
    </th>
  );
}

/* ================================================================== */
/* Table Body & Row / Cell                                            */
/* ================================================================== */

export function GlassTBody({
  children,
  className,
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cx("divide-y divide-[#e5e5e5]", className)}>
      {children}
    </tbody>
  );
}

export interface GlassTRProps extends HTMLAttributes<HTMLTableRowElement> {
  clickable?: boolean;
  selected?: boolean;
}

export function GlassTR({
  clickable = false,
  selected = false,
  children,
  className,
  ...props
}: GlassTRProps) {
  return (
    <tr
      className={cx(
        "transition-colors duration-150 group",
        clickable ? "cursor-pointer hover:bg-[#fafafa]" : "",
        selected ? "bg-[#f5f5f5]" : "",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function GlassTD({
  children,
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cx("py-3.5 px-4 text-xs sm:text-sm text-[#0a0a0a] align-middle", className)}
      {...props}
    >
      {children}
    </td>
  );
}
