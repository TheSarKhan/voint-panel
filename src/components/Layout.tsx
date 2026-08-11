import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { useTenantStore } from "../store/tenant";
import {
  IconCheckCircle,
  IconCreditCard,
  IconDashboard,
  IconDatabase,
  IconLayers,
  IconLogout,
  IconPhone,
  IconSettings,
  IconUser,
  IconUsers,
} from "./icons";
import { pendingApprovalCount } from "../api/approvals";
import { Wordmark } from "./Logo";
import type { ComponentType, SVGProps } from "react";

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const navItems: NavItem[] = [
  { to: "/", label: "Dashboard", icon: IconDashboard },
  { to: "/calls", label: "Zənglər", icon: IconPhone },
  { to: "/customers", label: "Müştərilər", icon: IconUsers },
  { to: "/rag", label: "Bilik bazası", icon: IconDatabase },
  { to: "/approvals", label: "Təsdiqlər", icon: IconCheckCircle },
  { to: "/team", label: "Komanda", icon: IconUser },
  { to: "/roles", label: "Rollar", icon: IconLayers },
  { to: "/billing", label: "Hesablaşma", icon: IconCreditCard },
  { to: "/settings", label: "Ayarlar", icon: IconSettings },
];

export function Layout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const clearTenant = useTenantStore((s) => s.clear);
  const tenant = useTenantStore((s) => s.tenant);
  const loadTenant = useTenantStore((s) => s.loadTenant);
  const navigate = useNavigate();
  const [pendingApprovals, setPendingApprovals] = useState(0);

  useEffect(() => {
    if (user?.tenantId && !tenant) {
      void loadTenant(user.tenantId);
    }
  }, [user?.tenantId, tenant, loadTenant]);

  // Gozleyen sorgu sayi. Deqiqede bir yoxlanilir: bu, baxilmali bir isin var oldugunu
  // bildirmek ucundur, canli sayğac deyil.
  useEffect(() => {
    if (!user?.tenantId) return;
    const tenantId = user.tenantId;
    let cancelled = false;
    const check = () =>
      pendingApprovalCount(tenantId)
        .then((n) => {
          if (!cancelled) setPendingApprovals(n);
        })
        // Icazesi olmayan istifadeci ucun 403 gelir - bu, xeta deyil, sadece gostermirik.
        .catch(() => undefined);
    check();
    const timer = setInterval(check, 60_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [user?.tenantId]);

  const handleLogout = () => {
    logout();
    clearTenant();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface">
        <div className="flex flex-col gap-1 border-b border-border px-5 pb-4 pt-6">
          <Wordmark size="1.6rem" />
          <p className="text-[11px] text-fg-faint">Biznes Paneli</p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-surface-2 font-medium text-fg"
                    : "text-fg-muted hover:bg-surface-2/60 hover:text-fg"
                }`
              }
            >
              <Icon />
              {label}
              {/* Sayğac düz rəqəmdir, nişan deyil: dizayn qaydası badge istəmir, və rəqəmin
                  özü onsuz da lazım olan yeganə məlumatdır. */}
              {to === "/approvals" && pendingApprovals > 0 && (
                <span className="ml-auto tabular-nums text-xs text-fg-faint">
                  {pendingApprovals}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <div className="mb-2 px-3">
            <p className="truncate text-sm font-medium text-fg">
              {tenant?.name ?? user?.name ?? "—"}
            </p>
            <p className="truncate text-xs text-fg-faint">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-fg-muted transition-colors hover:bg-surface-2/60 hover:text-fg"
          >
            <IconLogout />
            Çıxış
          </button>
        </div>
      </aside>

      {/* Content */}
      {/* Tam en, soldan baslayir. Evvel mx-auto max-w-6xl idi: genis ekranda sag teref
          bos qalirdi, zeng cedveli ise sixilib ufuqi surusurdu. Bu panel sened deyil,
          is ekranidir — eni oxunaqliliq ucun daraltmaq burada eks netice verir.
          voint-admin-de eyni deyisiklik artiq edilib, iki panel eyni qalir. */}
      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
