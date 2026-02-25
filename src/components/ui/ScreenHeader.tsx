/**
 * ScreenHeader — shared h-24 sticky header for all app screens.
 * Enforces the design system header pattern across every screen.
 *
 * Layout:
 *   [label + title]  [extras?]  ·  [actions?]  [NotificationCenter]  [Avatar → /profile]
 */

import { ReactNode } from "react";
import { useNavigate } from "react-router";
import { useProfile } from "../../context/ProfileContext";
import { NotificationCenter } from "../NotificationCenter";

interface ScreenHeaderProps {
  /** Small all-caps label above the title e.g. "Dashboard", "Tasks" */
  label: string;
  /** Large Playfair Display italic title */
  title: string | ReactNode;
  /**
   * Optional chips / badges rendered between the title block and the right divider.
   * e.g. streak chip on Dashboard, energy status chip on Energy Hub.
   */
  extras?: ReactNode;
  /**
   * Optional primary CTA buttons rendered just before NotificationCenter.
   * e.g. "+ New Task" on Tasks, "Edit Profile" on Profile.
   */
  actions?: ReactNode;
  /** Hide the right-side NotificationCenter + Avatar (default: shown) */
  hideRight?: boolean;
}

const HEADER_GLASS: React.CSSProperties = {
  backgroundColor: "rgba(255,255,255,0.82)",
  backdropFilter: "blur(14px) saturate(180%)",
  WebkitBackdropFilter: "blur(14px) saturate(180%)",
  borderBottom: "1px solid rgba(0,0,0,0.06)",
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
};

export function ScreenHeader({
  label,
  title,
  extras,
  actions,
  hideRight = false,
}: ScreenHeaderProps) {
  const navigate = useNavigate();
  const { profile } = useProfile();

  const initials = profile.fullName
    ? profile.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "KA";

  return (
    <header
      className="h-24 flex items-center justify-between px-10 sticky top-0 z-20 flex-shrink-0"
      style={HEADER_GLASS}
    >
      {/* Left — label + title */}
      <div className="flex flex-col min-w-0 shrink-0">
        <p
          className="text-xs font-bold uppercase tracking-[0.14em]"
          style={{ color: "#9CA3AF" }}
        >
          {label}
        </p>
        <div
          className="text-[22px] mt-0.5 italic"
          style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
        >
          {title}
        </div>
      </div>

      {/* Right — extras + actions + notifications + avatar */}
      {!hideRight && (
        <div className="flex items-center gap-4 ml-6">
          {/* Extras (streak chip, energy chip, etc.) */}
          {extras && (
            <>
              {extras}
              <div className="w-px h-6 bg-gray-200" />
            </>
          )}

          {/* Primary CTA actions */}
          {actions}

          {/* Notification bell */}
          <NotificationCenter />

          {/* Profile avatar */}
          <button
            className="w-9 h-9 rounded-full ring-2 ring-white shadow-sm overflow-hidden flex-shrink-0 hover:ring-gray-300 transition-all"
            onClick={() => navigate("/profile")}
            title="Your profile"
          >
            {profile.profileImage ? (
              <img
                src={profile.profileImage}
                alt={profile.fullName || "Profile"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-xs font-bold"
                style={{ background: "#111827", color: "white" }}
              >
                {initials}
              </div>
            )}
          </button>
        </div>
      )}
    </header>
  );
}

/** Global animation styles — inject once via AppLayout or each screen */
export const SCREEN_ANIMATIONS = `
  @keyframes fadeInUp {
    0%   { opacity: 0; transform: translateY(12px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes settle {
    0%   { opacity: 0; letter-spacing: 0.05em; }
    100% { opacity: 1; letter-spacing: normal; }
  }
`;
