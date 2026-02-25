import { ReactNode } from "react";
import { useLocation } from "react-router";
import { GlobalOrb } from "./GlobalOrb";
import { KaalNavbar } from "./KaalNavbar";
import { MobileNavigation } from "./MobileNavigation";
import { CommandPalette } from "./CommandPalette";
import { DumpEverythingFAB } from "./DumpEverythingFAB";
import { ProactiveAICoach } from "./ProactiveAICoach";
import { Toaster } from "sonner@2.0.3";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();

  return (
    <div
      className="h-screen flex overflow-hidden relative font-sans antialiased"
      style={{ backgroundColor: "#F8F9FA", color: "#1A1A1A" }}
    >
      {/* Noise Texture Overlay */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-60 mix-blend-overlay"
        style={{
          backgroundImage:
            "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.05%22/%3E%3C/svg%3E')",
        }}
      />

      {/* Sidebar Navigation - Hidden on mobile */}
      <KaalNavbar />

      {/* Main Content Area */}
      <main
        id="main-content"
        className="flex-1 flex flex-col overflow-hidden min-w-0"
        role="main"
      >
        <div className="flex-1 overflow-auto">{children}</div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNavigation />

      {/* Global Orb - Always visible */}
      <GlobalOrb />

      {/* Command Palette */}
      <CommandPalette />

      {/* ⌘⇧B shortcut → KAAL Agent Brain Dump tab */}
      <DumpEverythingFAB />

      {/* Proactive AI Coach — always monitoring */}
      <ProactiveAICoach />

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          style: {
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.5)",
            color: "#111827",
            fontFamily: "Inter, sans-serif",
          },
        }}
      />
    </div>
  );
}