import { useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { useTenantStore } from "../store/tenant";
import {
  IconCalendar,
  IconDashboard,
  IconDatabase,
  IconLogout,
  IconMic,
  IconPhone,
  IconSettings,
  IconUsers,
} from "./icons";
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
  { to: "/reservations", label: "Rezervasiyalar", icon: IconCalendar },
  { to: "/rag", label: "RAG Data", icon: IconDatabase },
  { to: "/settings", label: "Ayarlar", icon: IconSettings },
];

export function Layout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const clearTenant = useTenantStore((s) => s.clear);
  const tenant = useTenantStore((s) => s.tenant);
  const loadTenant = useTenantStore((s) => s.loadTenant);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.tenantId && !tenant) {
      void loadTenant(user.tenantId);
    }
  }, [user?.tenantId, tenant, loadTenant]);

  const handleLogout = () => {
    logout();
    clearTenant();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface">
        <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-accent-fg">
            <IconMic width={16} height={16} />
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight text-fg">Voint</p>
            <p className="text-[11px] text-fg-faint">Biznes Paneli</p>
          </div>
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
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
