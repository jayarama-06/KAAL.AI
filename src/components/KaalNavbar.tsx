/**
 * KaalNavbar — Collapsible desktop sidebar
 * Expanded (220px) ↔ Icon rail (68px), persisted in localStorage.
 * Tooltip labels when collapsed. Smooth 300ms transition.
 */

import { Link, useLocation, useNavigate } from "react-router";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useProfile } from "../context/ProfileContext";
import { toast } from "sonner";
import {
  LayoutDashboard,
  CheckSquare,
  Timer,
  BarChart2,
  Zap,
  Brain,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  Search,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  icon: React.ElementType;
  label: string;
  to: string;
  ai?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CORE_NAV: NavItem[] = [
  { icon: LayoutDashboard, label: "Home",       to: "/dashboard" },
  { icon: CheckSquare,     label: "Tasks",      to: "/tasks" },
  { icon: Timer,           label: "Focus",      to: "/focus" },
  { icon: BarChart2,       label: "Analytics",  to: "/analytics" },
  { icon: Zap,             label: "Energy",     to: "/energy" },
];

const AI_NAV: NavItem[] = [
  { icon: Brain, label: "KAAL Agent", to: "/agent", ai: true },
];

const BOTTOM_NAV: NavItem[] = [
  { icon: User,     label: "Profile",  to: "/profile" },
  { icon: Settings, label: "Settings", to: "/settings" },
];

const COLLAPSED_KEY = "kaal_sidebar_collapsed";
const W_OPEN   = 220;
const W_CLOSED =  68;

// ─── Tooltip wrapper (only shows when sidebar is collapsed) ───────────────────

function NavTooltip({ label, collapsed, children }: { label: string; collapsed: boolean; children: React.ReactNode }) {
  return (
    <div className="relative group/tip">
      {children}
      {collapsed && (
        <div
          className="
            pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3
            px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap
            opacity-0 group-hover/tip:opacity-100
            transition-all duration-150 delay-100
            z-[999]
          "
          style={{
            background: "#111827",
            color: "white",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            fontSize: "11px",
            letterSpacing: "0.02em",
          }}
        >
          {label}
          {/* left arrow */}
          <span
            className="absolute right-full top-1/2 -translate-y-1/2"
            style={{
              borderWidth: "4px",
              borderStyle: "solid",
              borderColor: "transparent #111827 transparent transparent",
            }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Single nav link ──────────────────────────────────────────────────────────

function NavLink({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;

  return (
    <NavTooltip label={item.label} collapsed={collapsed}>
      <Link
        to={item.to}
        className="flex items-center rounded-xl transition-all duration-200 select-none group/link relative"
        style={{
          gap: collapsed ? 0 : "10px",
          padding: collapsed ? "10px 0" : "9px 12px",
          justifyContent: collapsed ? "center" : "flex-start",
          color: active
            ? item.ai ? "#6366F1" : "#111827"
            : "#9CA3AF",
          background: active
            ? item.ai
              ? "rgba(99,102,241,0.09)"
              : "rgba(255,255,255,0.75)"
            : "transparent",
          border: active
            ? `1px solid ${item.ai ? "rgba(99,102,241,0.22)" : "rgba(255,255,255,0.8)"}`
            : "1px solid transparent",
          boxShadow: active ? "0 1px 6px rgba(0,0,0,0.05)" : "none",
        }}
        onMouseEnter={e => {
          if (!active) {
            (e.currentTarget as HTMLElement).style.color = item.ai ? "#6366F1" : "#111827";
            (e.currentTarget as HTMLElement).style.background = item.ai
              ? "rgba(99,102,241,0.05)"
              : "rgba(255,255,255,0.45)";
          }
        }}
        onMouseLeave={e => {
          if (!active) {
            (e.currentTarget as HTMLElement).style.color = "#9CA3AF";
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }
        }}
      >
        {/* Active indicator — left edge bar */}
        {active && !collapsed && (
          <span
            className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
            style={{ backgroundColor: item.ai ? "#6366F1" : "#111827" }}
          />
        )}

        <Icon
          className="flex-shrink-0 transition-transform duration-200"
          style={{
            width: 18, height: 18,
            strokeWidth: active ? 2.2 : 1.6,
            color: active ? (item.ai ? "#6366F1" : "#111827") : "inherit",
          }}
        />

        {!collapsed && (
          <span
            className="text-sm truncate transition-all duration-200"
            style={{ fontFamily: "'Inter', sans-serif", fontWeight: active ? 600 : 450 }}
          >
            {item.label}
          </span>
        )}

        {/* AI pill */}
        {item.ai && !active && !collapsed && (
          <span
            className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
            style={{ background: "rgba(99,102,241,0.1)", color: "#6366F1", letterSpacing: "0.05em" }}
          >
            AI
          </span>
        )}
      </Link>
    </NavTooltip>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (collapsed) {
    return (
      <div
        className="w-5 h-px mx-auto my-1"
        style={{ background: "rgba(0,0,0,0.08)" }}
      />
    );
  }
  return (
    <p
      className="px-3 text-[10px] font-bold uppercase tracking-[0.14em] mb-1"
      style={{ color: "#C4C9D4" }}
    >
      {label}
    </p>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function KaalNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const sidebarRef = useRef<HTMLElement>(null);
  const [hovered, setHovered] = useState(false);

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem(COLLAPSED_KEY) === "true"; } catch { return false; }
  });

  const isActive = (path: string) =>
    location.pathname === path || (path === "/dashboard" && location.pathname === "/");

  // Persist collapse state
  useEffect(() => {
    try { localStorage.setItem(COLLAPSED_KEY, String(collapsed)); } catch {}
  }, [collapsed]);

  // Command palette trigger
  const openCmd = () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
  };

  const handleSignOut = async () => {
    const result = await signOut();
    if (result.success) {
      toast.success("Signed out");
    } else {
      toast.error("Failed to sign out");
    }
  };

  const firstName = (profile.fullName || "").split(" ")[0] || "You";
  const initials = profile.fullName
    ? profile.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "KA";

  return (
    <aside
      ref={sidebarRef}
      className="hidden lg:flex flex-col flex-shrink-0 h-full z-30 relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: collapsed ? W_CLOSED : W_OPEN,
        transition: "width 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderRight: "1px solid rgba(255,255,255,0.55)",
        boxShadow: "1px 0 0 rgba(0,0,0,0.04)",
        overflow: "visible",
      }}
    >
      {/* ── Collapse toggle — right edge pill ───────────────────────── */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="absolute -right-3.5 top-[84px] w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 z-50"
        style={{
          background: "white",
          border: "1px solid rgba(0,0,0,0.10)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
          color: "#6B7280",
          opacity: hovered ? 1 : 0,
          pointerEvents: hovered ? "auto" : "none",
        }}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <ChevronLeft
          className="transition-transform duration-280"
          style={{
            width: 13, height: 13,
            transform: collapsed ? "rotate(180deg)" : "rotate(0deg)",
            strokeWidth: 2.5,
          }}
        />
      </button>

      {/* Make the toggle visible on sidebar hover */}
      <style>{`
        aside:hover .collapse-toggle { opacity: 1 !important; }
      `}</style>

      {/* ── Logo / Brand ─────────────────────────────────────────────── */}
      <div
        className="h-24 flex items-center flex-shrink-0 overflow-hidden"
        style={{
          padding: collapsed ? "0" : "0 18px",
          justifyContent: collapsed ? "center" : "flex-start",
          borderBottom: "1px solid rgba(0,0,0,0.04)",
        }}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          {/* Lettermark */}
          <div
            className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background: "#111827",
              color: "white",
              fontFamily: "'Playfair Display', serif",
              fontWeight: 700,
              fontSize: 15,
              boxShadow: "0 2px 12px rgba(17,24,39,0.18)",
              letterSpacing: "0.02em",
            }}
          >
            K
          </div>

          {/* Wordmark — fades out when collapsing */}
          <span
            className="overflow-hidden whitespace-nowrap"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 700,
              fontSize: 18,
              color: "#111827",
              letterSpacing: "-0.01em",
              maxWidth: collapsed ? 0 : 120,
              opacity: collapsed ? 0 : 1,
              transition: "max-width 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease",
            }}
          >
            KAAL
          </span>
        </div>
      </div>

      {/* ── Search / Command pill ────────────────────────────────────── */}
      <div
        className="flex-shrink-0"
        style={{ padding: collapsed ? "10px 10px 4px" : "10px 12px 4px" }}
      >
        <NavTooltip label="Search  ⌘K" collapsed={collapsed}>
          <button
            onClick={openCmd}
            className="w-full flex items-center rounded-xl transition-all duration-200 group/search"
            style={{
              gap: collapsed ? 0 : 8,
              padding: collapsed ? "9px 0" : "8px 10px",
              justifyContent: collapsed ? "center" : "flex-start",
              background: "rgba(0,0,0,0.03)",
              border: "1px solid rgba(0,0,0,0.06)",
              color: "#B0B7C3",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.055)";
              (e.currentTarget as HTMLElement).style.color = "#6B7280";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.03)";
              (e.currentTarget as HTMLElement).style.color = "#B0B7C3";
            }}
          >
            <Search style={{ width: 15, height: 15, strokeWidth: 1.8, flexShrink: 0 }} />
            {!collapsed && (
              <>
                <span className="text-xs flex-1 text-left" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Search...
                </span>
                <kbd
                  className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{
                    background: "rgba(0,0,0,0.06)",
                    color: "#9CA3AF",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 10,
                    border: "1px solid rgba(0,0,0,0.08)",
                    letterSpacing: "0.02em",
                  }}
                >
                  ⌘K
                </kbd>
              </>
            )}
          </button>
        </NavTooltip>
      </div>

      {/* ── Nav items ────────────────────────────────────────────────── */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-visible"
        style={{ padding: collapsed ? "8px 10px" : "8px 12px" }}
      >
        {/* Core section */}
        <div className="space-y-0.5 mb-4">
          <SectionLabel label="Core" collapsed={collapsed} />
          {CORE_NAV.map(item => (
            <NavLink
              key={item.to}
              item={item}
              active={isActive(item.to)}
              collapsed={collapsed}
            />
          ))}
        </div>

        {/* Divider */}
        <div
          className="my-3"
          style={{ height: 1, background: "linear-gradient(to right, transparent, rgba(0,0,0,0.07), transparent)" }}
        />

        {/* AI section */}
        <div className="space-y-0.5 mb-4">
          <SectionLabel label="AI" collapsed={collapsed} />
          {AI_NAV.map(item => (
            <NavLink
              key={item.to}
              item={item}
              active={isActive(item.to)}
              collapsed={collapsed}
            />
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />
      </nav>

      {/* ── Bottom: account actions ───────────────────────────────────── */}
      <div
        className="flex-shrink-0"
        style={{
          padding: collapsed ? "8px 10px" : "8px 12px",
          borderTop: "1px solid rgba(0,0,0,0.05)",
        }}
      >
        <div className="space-y-0.5">
          {BOTTOM_NAV.map(item => (
            <NavLink
              key={item.to}
              item={item}
              active={isActive(item.to)}
              collapsed={collapsed}
            />
          ))}

          {/* Sign out */}
          <NavTooltip label="Sign Out" collapsed={collapsed}>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center rounded-xl transition-all duration-200 group/so"
              style={{
                gap: collapsed ? 0 : "10px",
                padding: collapsed ? "10px 0" : "9px 12px",
                justifyContent: collapsed ? "center" : "flex-start",
                color: "#C4C9D4",
                background: "transparent",
                border: "1px solid transparent",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = "#EF4444";
                (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.05)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = "#C4C9D4";
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <LogOut style={{ width: 18, height: 18, strokeWidth: 1.6, flexShrink: 0 }} />
              {!collapsed && (
                <span className="text-sm" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 450 }}>
                  Sign Out
                </span>
              )}
            </button>
          </NavTooltip>
        </div>

        {/* ── User profile card ─────────────────────────────── */}
        <div
          className="mt-3 pt-3"
          style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}
        >
          <NavTooltip label={firstName} collapsed={collapsed}>
            <button
              onClick={() => navigate("/profile")}
              className="w-full flex items-center rounded-xl transition-all duration-200 overflow-hidden"
              style={{
                gap: collapsed ? 0 : 10,
                padding: collapsed ? "8px 0" : "8px 10px",
                justifyContent: collapsed ? "center" : "flex-start",
                background: "transparent",
                border: "1px solid transparent",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.6)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.8)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.borderColor = "transparent";
              }}
            >
              {/* Avatar */}
              <div
                className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden ring-2 ring-white shadow-sm"
                style={{ background: "#E5E7EB" }}
              >
                {profile.profileImage ? (
                  <img src={profile.profileImage} alt={firstName} className="w-full h-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-[11px] font-bold"
                    style={{ background: "#111827", color: "white", fontFamily: "'Inter', sans-serif" }}
                  >
                    {initials}
                  </div>
                )}
              </div>

              {/* Name + title */}
              {!collapsed && (
                <div className="flex-1 text-left overflow-hidden">
                  <p
                    className="text-xs truncate"
                    style={{ color: "#374151", fontFamily: "'Inter', sans-serif", fontWeight: 500 }}
                  >
                    {profile.fullName || firstName}
                  </p>
                  {profile.professionalTitle && (
                    <p
                      className="text-[10px] truncate"
                      style={{ color: "#9CA3AF", fontFamily: "'Inter', sans-serif" }}
                    >
                      {profile.professionalTitle}
                    </p>
                  )}
                </div>
              )}
            </button>
          </NavTooltip>
        </div>
      </div>
    </aside>
  );
}