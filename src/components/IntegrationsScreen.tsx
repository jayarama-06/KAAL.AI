import { motion } from "motion/react";
import { 
  Plus, 
  Settings,
  RefreshCw,
  Zap,
  ExternalLink,
  Code,
  Copy,
  Sliders
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { copyToClipboard } from "../utils/clipboard";

export function IntegrationsScreen() {
  const [copied, setCopied] = useState(false);

  const handleReconnect = (integrationName: string) => {
    toast.success(`Reconnecting to ${integrationName}...`, {
      description: "You'll be redirected to authorize the connection."
    });
    // Simulate OAuth flow
    setTimeout(() => {
      toast.success(`${integrationName} reconnected successfully!`);
    }, 2000);
  };

  const handleSetupIntegration = (integrationName: string) => {
    toast.info(`Starting ${integrationName} setup...`, {
      description: "Follow the setup wizard to connect your account."
    });
    // In a real app, this would open a setup modal or redirect
  };

  const handleRefreshSync = (integrationName: string) => {
    toast.success(`Syncing ${integrationName}...`, {
      description: "Data will be updated shortly."
    });
  };

  const handleCopyAPIKey = () => {
    const apiKey = "kaal_sk_1a2b3c4d5e6f7g8h9i0j";
    copyToClipboard(apiKey);
    setCopied(true);
    toast.success("API Key copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleViewDocs = () => {
    toast.info("Opening API documentation...");
    window.open('https://docs.kaal.app/api', '_blank');
  };

  const integrationCards = [
    {
      id: 1,
      name: "Slack",
      description: "Real-time notifications and slash commands for team updates.",
      status: "active",
      statusColor: "green",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <rect fill="#4A154B" height="20" rx="4" width="20" x="2" y="2"></rect>
          <circle cx="8" cy="8" fill="white" opacity="0.9" r="2.5"></circle>
          <rect fill="white" height="5" opacity="0.9" rx="2" width="6" x="12" y="5.5"></rect>
          <rect fill="white" height="6" opacity="0.9" rx="2" width="5" x="5.5" y="12"></rect>
          <circle cx="16" cy="16" fill="white" opacity="0.9" r="2.5"></circle>
        </svg>
      ),
      footer: {
        type: "sync",
        text: "Last sync: 2m ago"
      },
      delay: 0.3
    },
    {
      id: 2,
      name: "Notion",
      description: "Two-way sync for project databases and documentation.",
      status: "active",
      statusColor: "green",
      icon: (
        <span 
          className="font-bold text-3xl"
          style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
        >
          N
        </span>
      ),
      footer: {
        type: "workspaces",
        count: 4
      },
      delay: 0.4
    },
    {
      id: 3,
      name: "Google Drive",
      description: "Automatic backup and file linking for task attachments.",
      status: "reauth",
      statusColor: "amber",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 15L8.5 7H19.5L15 15H4Z" fill="#34A853" fillOpacity="0.2" stroke="#34A853" strokeLinejoin="round" strokeWidth="2"></path>
          <path d="M4 15L8.5 22L12 15H4Z" fill="#EA4335" fillOpacity="0.2" stroke="#EA4335" strokeLinejoin="round" strokeWidth="2"></path>
          <path d="M12 15L15.5 22H8.5L12 15Z" fill="#FBBC05" fillOpacity="0.2" stroke="#FBBC05" strokeLinejoin="round" strokeWidth="2"></path>
          <path d="M15 15L19.5 7L23 13L15.5 22L15 15Z" fill="#4285F4" fillOpacity="0.2" stroke="#4285F4" strokeLinejoin="round" strokeWidth="2"></path>
        </svg>
      ),
      footer: {
        type: "button",
        text: "Reconnect"
      },
      delay: 0.5
    },
    {
      id: 5,
      name: "GitHub",
      description: "Link pull requests to tasks automatically.",
      status: "connect",
      statusColor: "gray",
      icon: <Code className="w-8 h-8" strokeWidth={2} />,
      iconBg: "#111827",
      footer: {
        type: "setup",
        text: "Start Setup →"
      },
      delay: 0.7
    }
  ];

  return (
    <div className="flex-1 overflow-hidden flex flex-col" style={{ backgroundColor: "#F8F9FA" }}>
      {/* Header */}
      <header 
        className="h-24 border-b flex items-center justify-between px-10 sticky top-0 z-20"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderColor: "rgba(255, 255, 255, 0.5)",
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
        }}
      >
        <div className="flex flex-col">
          <h1 
            className="text-sm font-semibold tracking-wide uppercase"
            style={{ color: "#6B7280" }}
          >
            Workspace Settings
          </h1>
          <p 
            className="text-2xl italic"
            style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
          >
            Integrations Hub
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div 
            className="flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.6)",
              borderColor: "rgba(255, 255, 255, 0.8)",
              backdropFilter: "blur(4px)"
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="7" fill="#22c55e" opacity="0.2"/>
              <path d="M6 9L8 11L12 7" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-xs font-bold tracking-wide" style={{ color: "#111827" }}>
              ALL SYSTEMS OPERATIONAL
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-10 scroll-smooth">
        <div className="max-w-7xl mx-auto space-y-10">
          {/* Hero Section */}
          <div className="flex justify-between items-end">
            <div>
              <motion.h2
                initial={{ opacity: 0, letterSpacing: "0.05em" }}
                animate={{ opacity: 1, letterSpacing: "0" }}
                transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }}
                className="text-5xl font-medium tracking-tight leading-tight"
                style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
              >
                Connect Your <span className="italic">World.</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="mt-3 text-lg font-light tracking-wide max-w-lg"
                style={{ color: "#6B7280" }}
              >
                Boost your productivity by connecting KAAL with your essential tools.
              </motion.p>
            </div>
          </div>

          {/* Integration Cards Grid */}
          <div className="grid grid-cols-12 gap-6">
            {integrationCards.map((integration) => (
              <motion.div
                key={integration.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: integration.delay, duration: 0.5 }}
                className="col-span-12 md:col-span-6 lg:col-span-4 rounded-3xl p-8 border group cursor-pointer transition-all duration-500 relative"
                style={{
                  background: "linear-gradient(160deg, rgba(255, 255, 255, 0.55) 0%, rgba(255, 255, 255, 0.4) 100%)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  borderColor: "rgba(255, 255, 255, 0.4)",
                  boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)";
                }}
              >
                {/* Refraction Border Effect */}
                <div 
                  className="absolute inset-0 rounded-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    padding: "1px",
                    background: "linear-gradient(110deg, rgba(255,255,255,0.4), rgba(255,255,255,0.9), rgba(255,255,255,0.4))",
                    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude"
                  }}
                ></div>

                <div className="flex justify-between items-start mb-6">
                  <div 
                    className="w-14 h-14 rounded-2xl shadow-md flex items-center justify-center p-3 border"
                    style={{
                      backgroundColor: integration.iconBg || "#FFFFFF",
                      borderColor: integration.iconBg ? "rgba(55, 65, 81, 1)" : "#F3F4F6",
                      color: integration.iconBg ? "#FFFFFF" : "#111827"
                    }}
                  >
                    {integration.icon}
                  </div>
                  <div 
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm border`}
                    style={{
                      backgroundColor: integration.statusColor === "green" 
                        ? "#f0fdf4" 
                        : integration.statusColor === "amber" 
                        ? "#fffbeb" 
                        : "#f3f4f6",
                      color: integration.statusColor === "green" 
                        ? "#15803d" 
                        : integration.statusColor === "amber" 
                        ? "#b45309" 
                        : "#6B7280",
                      borderColor: integration.statusColor === "green" 
                        ? "#bbf7d0" 
                        : integration.statusColor === "amber" 
                        ? "#fde68a" 
                        : "#e5e7eb"
                    }}
                  >
                    {integration.status === "active" && (
                      <span 
                        className="w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{ 
                          backgroundColor: "#22c55e",
                          boxShadow: "0 0 20px rgba(34, 197, 94, 0.25)"
                        }}
                      ></span>
                    )}
                    {integration.status === "reauth" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    )}
                    {integration.status === "active" ? "Active" : integration.status === "reauth" ? "Re-auth" : "Connect"}
                  </div>
                </div>

                <h3 
                  className="text-xl font-bold mb-1 transition-colors"
                  style={{ color: "#111827" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#2563eb";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#111827";
                  }}
                >
                  {integration.name}
                </h3>
                <p className="text-sm mb-6 font-light" style={{ color: "#6B7280" }}>
                  {integration.description}
                </p>

                {/* Footer */}
                {integration.footer.type === "sync" && (
                  <div 
                    className="w-full rounded-lg p-3 border flex items-center justify-between text-xs"
                    style={{
                      backgroundColor: "rgba(243, 244, 246, 0.5)",
                      borderColor: "rgba(229, 231, 235, 0.5)",
                      color: "#6B7280"
                    }}
                  >
                    <span>{integration.footer.text}</span>
                    <RefreshCw className="w-4 h-4" strokeWidth={2} />
                  </div>
                )}

                {integration.footer.type === "workspaces" && (
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200 border border-white"></div>
                      <div className="w-6 h-6 rounded-full bg-gray-300 border border-white"></div>
                      <div 
                        className="w-6 h-6 rounded-full bg-gray-400 border border-white flex items-center justify-center text-[8px] text-white font-bold"
                      >
                        +{integration.footer.count}
                      </div>
                    </div>
                    <span className="text-xs ml-2" style={{ color: "#6B7280" }}>Shared workspaces</span>
                  </div>
                )}

                {integration.footer.type === "button" && (
                  <button 
                    className="w-full py-2 text-xs font-bold rounded-lg transition-colors uppercase tracking-wide"
                    style={{
                      backgroundColor: "rgba(254, 243, 199, 0.5)",
                      color: "#92400e"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#fef3c7";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(254, 243, 199, 0.5)";
                    }}
                    onClick={() => handleReconnect(integration.name)}
                  >
                    {integration.footer.text}
                  </button>
                )}

                {integration.footer.type === "setup" && (
                  <div className="mt-auto">
                    <button 
                      className="text-xs font-bold pb-0.5 transition-all"
                      style={{
                        color: "#111827",
                        borderBottom: "1px solid rgba(17, 24, 39, 0.2)"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderBottomColor = "#111827";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderBottomColor = "rgba(17, 24, 39, 0.2)";
                      }}
                      onClick={() => handleSetupIntegration(integration.name)}
                    >
                      {integration.footer.text}
                    </button>
                  </div>
                )}
              </motion.div>
            ))}

            {/* Linear Card - Large */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="col-span-12 lg:col-span-8 rounded-3xl p-8 border group relative overflow-hidden transition-all duration-500"
              style={{
                background: "linear-gradient(160deg, rgba(255, 255, 255, 0.55) 0%, rgba(255, 255, 255, 0.4) 100%)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                borderColor: "rgba(255, 255, 255, 0.4)",
                boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)";
              }}
            >
              <div 
                className="absolute right-0 top-0 bottom-0 w-1/3 pointer-events-none"
                style={{
                  background: "linear-gradient(to left, rgba(255, 255, 255, 0.4), transparent)"
                }}
              ></div>

              <div className="flex items-start gap-6 relative z-10">
                <div 
                  className="w-16 h-16 rounded-2xl text-white shadow-xl flex items-center justify-center p-3 border flex-shrink-0"
                  style={{
                    backgroundColor: "#111827",
                    borderColor: "#374151"
                  }}
                >
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path d="M16 4L4 28L16 22L28 28L16 4Z" fill="white" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-bold mb-1" style={{ color: "#111827" }}>
                        Linear
                      </h3>
                      <p className="text-sm font-light max-w-sm" style={{ color: "#6B7280" }}>
                        High-performance issue tracking. Syncs bidirectional status updates with KAAL Tasks.
                      </p>
                    </div>
                    <div className="hidden sm:block">
                      <div 
                        className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm border"
                        style={{
                          backgroundColor: "#eff6ff",
                          color: "#1e40af",
                          borderColor: "#bfdbfe"
                        }}
                      >
                        <Zap className="w-[14px] h-[14px]" strokeWidth={2.5} />
                        Webhooks Active
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 flex gap-8">
                    <div className="flex flex-col gap-1">
                      <span 
                        className="text-2xl font-bold"
                        style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
                      >
                        124
                      </span>
                      <span 
                        className="text-[10px] uppercase tracking-widest font-bold"
                        style={{ color: "#6B7280" }}
                      >
                        Issues Synced
                      </span>
                    </div>
                    <div className="w-px h-10 bg-gray-200"></div>
                    <div className="flex flex-col gap-1">
                      <span 
                        className="text-2xl font-bold"
                        style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
                      >
                        12
                      </span>
                      <span 
                        className="text-[10px] uppercase tracking-widest font-bold"
                        style={{ color: "#6B7280" }}
                      >
                        Pending
                      </span>
                    </div>
                    <div className="w-px h-10 bg-gray-200"></div>
                    <div className="flex flex-col gap-1">
                      <span 
                        className="text-2xl font-bold"
                        style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
                      >
                        0.4s
                      </span>
                      <span 
                        className="text-[10px] uppercase tracking-widest font-bold"
                        style={{ color: "#6B7280" }}
                      >
                        Avg Latency
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Developer API Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-12 pt-8"
            style={{ borderTop: "1px solid rgba(229, 231, 235, 0.6)" }}
          >
            <div className="flex justify-between items-center mb-8">
              <h3 
                className="text-xl font-medium italic"
                style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
              >
                Developer API
              </h3>
              <button 
                className="text-sm font-medium flex items-center gap-1 transition-colors"
                style={{ color: "#6B7280" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#111827";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#6B7280";
                }}
                onClick={handleViewDocs}
              >
                View Documentation
                <ExternalLink className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>

            <div 
              className="p-6 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm"
              style={{
                background: "rgba(255, 255, 255, 0.4)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                borderColor: "rgba(255, 255, 255, 0.6)"
              }}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="p-3 rounded-xl border"
                  style={{
                    backgroundColor: "#eef2ff",
                    color: "#4f46e5",
                    borderColor: "#c7d2fe"
                  }}
                >
                  <Code className="w-6 h-6" strokeWidth={2} />
                </div>
                <div>
                  <h4 className="font-bold" style={{ color: "#111827" }}>
                    Personal Access Token
                  </h4>
                  <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
                    Created on Oct 01, 2023 • Expires in 30 days
                  </p>
                </div>
              </div>
              <div 
                className="flex-1 w-full md:w-auto rounded-lg p-3 text-xs truncate flex justify-between items-center group cursor-pointer transition-all border"
                style={{
                  backgroundColor: "#F3F4F6",
                  fontFamily: "monospace",
                  color: "#6B7280",
                  borderColor: "transparent",
                  letterSpacing: "0.05em"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#FFFFFF";
                  e.currentTarget.style.borderColor = "#E5E7EB";
                  e.currentTarget.style.boxShadow = "inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#F3F4F6";
                  e.currentTarget.style.borderColor = "transparent";
                  e.currentTarget.style.boxShadow = "none";
                }}
                onClick={handleCopyAPIKey}
              >
                <span>kaal_live_sk_8923...9s8d</span>
                <Copy 
                  className="w-4 h-4 transition-colors"
                  style={{ color: "#9CA3AF" }}
                  strokeWidth={2}
                />
              </div>
              <button 
                className="whitespace-nowrap px-4 py-2 border rounded-lg text-xs font-bold transition-colors shadow-sm"
                style={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#E5E7EB",
                  color: "#ef4444"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#fef2f2";
                  e.currentTarget.style.borderColor = "#fecaca";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#FFFFFF";
                  e.currentTarget.style.borderColor = "#E5E7EB";
                }}
              >
                Revoke Token
              </button>
            </div>
          </motion.div>
        </div>
        <div className="h-24"></div>
      </div>

      {/* Floating Configuration Button */}
      <div className="fixed bottom-10 right-10 z-50">
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9, type: "spring" }}
          className="text-white rounded-full px-6 py-3 flex items-center gap-3 transition-all duration-500 hover:scale-105 active:scale-95 group ring-1 border-none"
          style={{
            backgroundColor: "rgba(17, 24, 39, 0.9)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            ringColor: "rgba(255, 255, 255, 0.2)",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            animation: "breathe 3s ease-in-out infinite"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#000000";
            e.currentTarget.style.boxShadow = "0 0 30px rgba(17, 24, 39, 0.3), 0 0 60px rgba(17, 24, 39, 0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(17, 24, 39, 0.9)";
            e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
          }}
        >
          <Settings className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" strokeWidth={2.5} />
          <span className="font-bold tracking-wide text-xs uppercase">Configuration</span>
        </motion.button>
      </div>
    </div>
  );
}