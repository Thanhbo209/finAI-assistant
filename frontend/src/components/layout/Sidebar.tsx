import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  PlusCircle,
  LogOut,
  Menu,
  X,
  Wallet,
  ChevronRight,
  Sun,
  Moon,
  Settings2,
  BrainCircuit,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { CURRENCY_META } from "@/types/currency.types";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { to: "/dashboard/add", icon: PlusCircle, label: "Add Transaction" },
  { to: "/dashboard/transactions", icon: Receipt, label: "Transactions" },
  { to: "/dashboard/intelligence", icon: BrainCircuit, label: "Intelligence" },
  { to: "/dashboard/settings", icon: Settings2, label: "Settings" },
];

interface SidebarProps {
  isDark: boolean;
  onToggleDark: () => void;
}

export function Sidebar({ isDark, onToggleDark }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { currency } = useCurrency();
  const currencyMeta = CURRENCY_META[currency];

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-4 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shrink-0">
          <Wallet className="h-4 w-4 " />
        </div>
        {!collapsed && (
          <span className="font-bold  tracking-tight truncate">ExpenseAI</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto hidden lg:flex h-6 w-6 items-center justify-center rounded  hover:text-white hover:bg-[hsl(var(--sidebar-muted))] transition-colors"
        >
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              collapsed && "rotate-180",
            )}
          />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto scrollbar-thin">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/dashboard"}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-black shadow-sm"
                  : "text-[hsl(var(--sidebar-fg))] hover:bg-[hsl(var(--sidebar-muted))] hover:text-white",
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-3 space-y-2">
        <button
          onClick={onToggleDark}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-[hsl(var(--sidebar-muted))] hover:text-white transition-colors"
        >
          {isDark ? (
            <Sun className="h-4 w-4 shrink-0" />
          ) : (
            <Moon className="h-4 w-4 shrink-0" />
          )}
          {!collapsed && <span>{isDark ? "Light Mode" : "Dark Mode"}</span>}
        </button>

        {user && !collapsed && (
          <div className="flex items-center gap-2 rounded-lg px-3 py-2">
            <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-white">
                {user.email.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] truncate">{user.email}</p>
            </div>
            {/* Active currency badge */}
            <div
              className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 shrink-0"
              title={`Active currency: ${currencyMeta.name}`}
            >
              <span className="text-[10px]">{currencyMeta.flag}</span>
              <span className="text-[10px] font-semibold text-primary">
                {currency}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-40 lg:hidden flex h-9 w-9 items-center justify-center rounded-lg bg-card border shadow-sm"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64  lg:hidden transform transition-transform",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-3 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 transition-all duration-300",
          collapsed ? "w-[60px]" : "w-[220px]",
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
