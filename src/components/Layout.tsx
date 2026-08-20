import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  PhoneCall,
  Users,
  Database,
  CheckCircle,
  UserCheck,
  Layers,
  CreditCard,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "../store/auth";
import { useTenantStore } from "../store/tenant";
import { pendingApprovalCount } from "../api/approvals";
import { Wordmark } from "./Logo";
import type { ReactNode } from "react";

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

const navItems: NavItem[] = [
  { to: "/", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/calls", label: "Zənglər", icon: <PhoneCall className="h-4 w-4" /> },
  { to: "/customers", label: "Müştərilər", icon: <Users className="h-4 w-4" /> },
  { to: "/rag", label: "Bilik bazası", icon: <Database className="h-4 w-4" /> },
  { to: "/approvals", label: "Təsdiqlər", icon: <CheckCircle className="h-4 w-4" /> },
  { to: "/team", label: "Komanda", icon: <UserCheck className="h-4 w-4" /> },
  { to: "/roles", label: "Rollar", icon: <Layers className="h-4 w-4" /> },
  { to: "/billing", label: "Hesablaşma", icon: <CreditCard className="h-4 w-4" /> },
  { to: "/settings", label: "Ayarlar", icon: <Settings className="h-4 w-4" /> },
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

  useEffect(() => {
    if (!user?.tenantId) return;
    const tenantId = user.tenantId;
    let cancelled = false;
    const check = () =>
      pendingApprovalCount(tenantId)
        .then((n) => {
          if (!cancelled) setPendingApprovals(n);
        })
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

  const displayName = tenant?.name ?? user?.name ?? "Müəssisə Paneli";

  return (
    <div className="flex h-screen w-full bg-white text-[#0a0a0a] selection:bg-[#39ff14] selection:text-black font-sans overflow-hidden">
      {/* ── SIDEBAR NAVIGATION ── */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-[#e5e5e5] bg-white z-20">
        {/* Brand Header */}
        <div className="flex flex-col gap-1 border-b border-[#e5e5e5] px-6 py-6">
          <Wordmark size="1.8rem" />
          <span className="text-xs font-medium text-[#6b6b6b] mt-0.5">
            Müəssisə İdarəetmə Paneli
          </span>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `relative flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-[#0a0a0a] text-white shadow-xs"
                    : "text-[#6b6b6b] hover:bg-[#f5f5f5] hover:text-[#0a0a0a]"
                }`
              }
            >
              <span className="shrink-0">{icon}</span>
              <span className="truncate">{label}</span>

              {to === "/approvals" && pendingApprovals > 0 && (
                <span className="ml-auto rounded-full bg-amber-500 text-white px-2 py-0.5 text-[10px] font-mono font-bold">
                  {pendingApprovals}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User / Tenant Footer */}
        <div className="border-t border-[#e5e5e5] p-4 bg-[#fafafa]">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#0a0a0a] text-white text-xs font-bold font-mono">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-[#0a0a0a]">
                {displayName}
              </p>
              <p className="truncate text-[11px] text-[#6b6b6b]">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#e5e5e5] bg-white py-2 text-xs font-medium text-[#6b6b6b] hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all cursor-pointer shadow-xs"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Çıxış</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="flex-1 overflow-y-auto bg-[#fafafa]/50">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
