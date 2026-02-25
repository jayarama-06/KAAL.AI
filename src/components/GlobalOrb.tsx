import { Brain } from "lucide-react";
import { useNavigate } from "react-router";

/**
 * GlobalOrb — Floating access button to KAAL Agent
 * Previously opened the CreativeCanvas; now opens the unified Agent screen
 * which includes Brain Dump, Chat, Plan, and Patterns.
 */
export function GlobalOrb() {
  const navigate = useNavigate();

  return (
    <>
      <div className="fixed bottom-10 right-10 z-50 group">
        {/* Ambient glow */}
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-20 scale-50 group-hover:scale-100 transition-transform duration-700"
          style={{ backgroundColor: "#111827" }}
        />

        <button
          onClick={() => navigate("/agent")}
          className="relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-95"
          title="Open KAAL Agent"
          style={{
            boxShadow:
              "0 0 40px rgba(17, 24, 39, 0.2), 0 0 80px rgba(17, 24, 39, 0.1), inset 0 0 20px rgba(255,255,255,0.5)",
            animation: "floatOrb 6s ease-in-out infinite",
          }}
        >
          {/* Glass surface */}
          <div
            className="absolute inset-0 rounded-full border overflow-hidden"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(200,200,255,0.2), rgba(17,24,39,0.8))",
              borderColor: "rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(12px)",
            }}
          >
            {/* Noise texture */}
            <div
              className="absolute inset-0 opacity-30 mix-blend-overlay"
              style={{
                backgroundImage:
                  "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.05%22/%3E%3C/svg%3E')",
              }}
            />
            {/* Ambient orbs */}
            <div
              className="absolute -top-10 -left-10 w-24 h-24 rounded-full blur-xl animate-pulse"
              style={{ backgroundColor: "rgba(96, 165, 250, 0.3)", animationDuration: "4s" }}
            />
            <div
              className="absolute -bottom-10 -right-10 w-24 h-24 rounded-full blur-xl animate-pulse"
              style={{ backgroundColor: "rgba(192, 132, 252, 0.3)", animationDuration: "4s", animationDelay: "1s" }}
            />
            {/* Highlight */}
            <div
              className="absolute top-2 left-4 w-6 h-3 rounded-full blur-md transform -rotate-45"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.4)" }}
            />
          </div>

          <Brain
            className="relative z-10 w-8 h-8 text-white opacity-90 group-hover:rotate-180 transition-transform duration-700"
          />

          {/* Tooltip */}
          <div
            className="absolute right-full mr-6 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 whitespace-nowrap shadow-lg"
            style={{
              backgroundColor: "rgba(17, 24, 39, 0.9)",
              color: "white",
              backdropFilter: "blur(12px)",
            }}
          >
            <span className="text-xs font-bold uppercase tracking-widest">KAAL Agent</span>
          </div>
        </button>
      </div>

      <style>{`
        @keyframes floatOrb {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </>
  );
}
