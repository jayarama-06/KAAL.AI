import { useState, useEffect } from "react";
import {
  Save,
  Camera,
  Ban,
  BellOff,
  Speaker,
  MessageCircle,
  ScreenShare,
  Palette,
  Music,
  Leaf,
  Activity,
  Mail,
  ListChecks,
  Sun,
  RefreshCw,
  History,
  Zap,
  Plus
} from "lucide-react";
import { FocusFlowModal } from "./FocusFlowModal";
import { useProfile } from "../context/ProfileContext";
import { toast } from "sonner@2.0.3";
import { useSaveStates } from "../hooks/useSaveStates";

export function SaveStatesScreen() {
  const { profile } = useProfile();
  const {
    states,
    activeState,
    activateState,
    refreshActiveState,
    getOptimizationData,
    getLast24HoursLogs,
    getActiveLog,
    getActiveDuration,
    formatDuration,
    getStateStats
  } = useSaveStates();

  const [showFocusFlowModal, setShowFocusFlowModal] = useState(false);
  const [activeDuration, setActiveDuration] = useState(0);

  // Update active duration every second
  useEffect(() => {
    if (!activeState) return;

    const interval = setInterval(() => {
      setActiveDuration(getActiveDuration());
    }, 1000);

    return () => clearInterval(interval);
  }, [activeState, getActiveDuration]);

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 17) return "Good Afternoon";
    if (hour >= 17 && hour < 21) return "Good Evening";
    return "Good Night";
  };

  const getColorClasses = (color: string) => {
    const colors = {
      purple: { bg: "bg-purple-600", text: "text-purple-600", border: "border-purple-500" },
      blue: { bg: "bg-blue-600", text: "text-blue-600", border: "border-blue-500" },
      orange: { bg: "bg-orange-500", text: "text-orange-500", border: "border-orange-500" },
      green: { bg: "bg-green-600", text: "text-green-600", border: "border-green-500" }
    };
    return colors[color as keyof typeof colors];
  };

  const handleActivatePreset = (presetId: string, presetTitle: string) => {
    activateState(presetId);
    toast.success(`"${presetTitle}" environment activated`, {
      description: "Your workspace is being configured to match this preset."
    });
  };

  const handleRefreshState = () => {
    refreshActiveState();
    toast.success("Environment refreshed", {
      description: "Current preset has been re-applied with updated settings."
    });
  };

  return (
    <div className="flex-1 overflow-y-auto scroll-smooth" style={{ backgroundColor: "#F8F9FA" }}>
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
            Workspace
          </h1>
          <p 
            className="text-2xl italic"
            style={{ 
              fontFamily: "'Playfair Display', serif",
              color: "#111827"
            }}
          >
            Save States Hub
          </p>
        </div>
        
        <div className="flex items-center gap-6">
          <div 
            className="relative flex items-center gap-3 px-5 py-2.5 rounded-full border shadow-sm backdrop-blur-sm overflow-hidden group cursor-default"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.6)",
              borderColor: "rgba(255, 255, 255, 0.8)"
            }}
          >
            <svg 
              className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
              preserveAspectRatio="none" 
              viewBox="0 0 100 30"
            >
              <path 
                className="sparkline-path"
                d="M0,20 Q20,25 40,15 T80,10 T100,20" 
                fill="none" 
                stroke="#111827" 
                strokeWidth="1"
                style={{
                  strokeDasharray: "100",
                  strokeDashoffset: "100",
                  animation: "dash 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards 0.5s"
                }}
              />
            </svg>
            <Zap 
              className="w-4 h-4 fill-primary" 
              style={{ 
                color: "#111827",
                textShadow: "0 0 8px rgba(0,0,0,0.1)",
                filter: "drop-shadow(0 0 8px rgba(0,0,0,0.1))"
              }} 
            />
            <span 
              className="text-[10px] font-bold tracking-widest uppercase relative z-10"
              style={{ color: "#111827" }}
            >
              92% Energy Efficiency
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-10">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Top Section */}
          <div className="flex justify-between items-end">
            <div>
              <h2 
                className="text-5xl font-medium tracking-tight leading-tight opacity-0"
                style={{ 
                  fontFamily: "'Playfair Display', serif",
                  color: "#111827",
                  animation: "settle 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards"
                }}
              >
                {getGreeting()}, <span className="italic">{(profile.fullName || 'there').split(' ')[0]}.</span>
              </h2>
              <p 
                className="mt-3 text-lg font-light tracking-wide max-w-lg opacity-0"
                style={{ 
                  color: "#6B7280",
                  animation: "fadeInUp 0.8s ease-out 0.2s forwards"
                }}
              >
                Restore a previously curated environment or capture your current flow state.
              </p>
            </div>
          </div>

          {/* Presets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Capture Card */}
            <div 
              className="rounded-[2rem] p-8 shadow-lg hover:shadow-2xl transition-all duration-500 flex flex-col items-center justify-center text-center group cursor-pointer border-2 border-dashed opacity-0"
              style={{
                background: "rgba(255, 255, 255, 0.45)",
                backdropFilter: "blur(40px) saturate(200%)",
                WebkitBackdropFilter: "blur(40px) saturate(200%)",
                borderColor: "rgba(17, 24, 39, 0.1)",
                animation: "fadeInUp 0.8s ease-out 0.3s forwards"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(17, 24, 39, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(17, 24, 39, 0.1)";
              }}
              onClick={() => setShowFocusFlowModal(true)}
            >
              <div 
                className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 relative"
              >
                <div 
                  className="absolute inset-0 rounded-full border-2 opacity-20 group-hover:opacity-40"
                  style={{
                    borderColor: "rgba(17, 24, 39, 0.2)",
                    animation: "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite"
                  }}
                />
                <Camera className="w-8 h-8 font-light" style={{ color: "#111827" }} />
              </div>
              <h3 
                className="text-xl font-bold mb-2"
                style={{ 
                  fontFamily: "'Playfair Display', serif",
                  color: "#111827"
                }}
              >
                Create new flow State
              </h3>
              <p className="text-sm px-6" style={{ color: "#6B7280" }}>
                Create Custom Flow States.
              </p>
            </div>

            {/* Preset Cards */}
            {states.map((preset, index) => {
              const details = [
                { icon: Ban, text: `${preset.settings.blockedApps.length} Apps Blocked` },
                { icon: BellOff, text: `Notifications: ${preset.settings.notifications}` },
                { icon: Speaker, text: preset.settings.audioPreset }
              ];
              
              const colorClasses = getColorClasses(preset.color);
              const gradient = preset.color === 'purple' ? 'rgba(168, 85, 247, 0.15)' :
                               preset.color === 'blue' ? 'rgba(59, 130, 246, 0.15)' :
                               preset.color === 'orange' ? 'rgba(249, 115, 22, 0.15)' :
                               'rgba(34, 197, 94, 0.15)';
              
              return (
                <div 
                  key={preset.id}
                  className={`rounded-[2rem] p-8 shadow-lg hover:shadow-2xl transition-all duration-500 relative overflow-hidden group cursor-pointer opacity-0 ${
                    activeState === preset.id ? 'ring-2 ring-offset-2 ring-purple-500' : ''
                  }`}
                  style={{
                    background: "rgba(255, 255, 255, 0.45)",
                    backdropFilter: "blur(40px) saturate(200%)",
                    WebkitBackdropFilter: "blur(40px) saturate(200%)",
                    border: "1px solid rgba(255, 255, 255, 0.5)",
                    animation: `fadeInUp 0.8s ease-out ${0.4 + index * 0.1}s forwards`
                  }}
                  onClick={() => handleActivatePreset(preset.id, preset.title)}
                >
                  <div 
                    className="absolute inset-0 opacity-40 group-hover:opacity-70 transition-opacity"
                    style={{
                      background: `radial-gradient(circle at 50% 50%, ${gradient} 0%, transparent 70%)`
                    }}
                  />
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-12">
                      <div 
                        className="w-16 h-16 rounded-2xl bg-white/80 shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform duration-500 text-3xl"
                      >
                        {preset.icon}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span 
                          className="text-[10px] font-bold tracking-[0.2em] uppercase"
                          style={{ color: `${preset.color === 'purple' ? '#7C3AED' : preset.color === 'blue' ? '#2563EB' : preset.color === 'orange' ? '#EA580C' : '#16A34A'}60` }}
                        >
                          Preset #{String(index + 1).padStart(2, '0')}
                        </span>
                        {activeState === preset.id && (
                          <span 
                            className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 uppercase tracking-wider"
                          >
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                    <h3 
                      className="text-2xl font-bold mb-4"
                      style={{ 
                        fontFamily: "'Playfair Display', serif",
                        color: "#111827"
                      }}
                    >
                      {preset.title}
                    </h3>
                    <div className="space-y-3">
                      {details.map((detail, idx) => (
                        <div 
                          key={idx}
                          className="flex items-center gap-3 text-xs font-medium"
                          style={{ color: "#6B7280" }}
                        >
                          <detail.icon className="w-4 h-4" />
                          {detail.text}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Optimization Card */}
            <div 
              className="rounded-[2rem] p-8 shadow-lg flex flex-col items-center justify-center opacity-0"
              style={{
                background: "rgba(255, 255, 255, 0.45)",
                backdropFilter: "blur(40px) saturate(200%)",
                WebkitBackdropFilter: "blur(40px) saturate(200%)",
                border: "1px solid rgba(255, 255, 255, 0.5)",
                animation: "fadeInUp 0.8s ease-out 0.8s forwards"
              }}
            >
              <div className="relative w-48 h-48 mb-6">
                <div 
                  className="absolute inset-0 rounded-full blur-2xl"
                  style={{ backgroundColor: "rgba(17, 24, 39, 0.05)" }}
                />
                <svg 
                  className="w-full h-full transform -rotate-90 relative z-10" 
                  viewBox="0 0 192 192"
                >
                  <circle 
                    cx="96" 
                    cy="96" 
                    r="86" 
                    fill="none" 
                    stroke="rgba(0,0,0,0.03)" 
                    strokeWidth="8"
                  />
                  <circle 
                    cx="96" 
                    cy="96" 
                    r="86" 
                    fill="none" 
                    stroke="#111827"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="540"
                    strokeDashoffset="135"
                    className="transition-all duration-1000 ease-out"
                    style={{
                      filter: "drop-shadow(0 0 15px rgba(17, 24, 39, 0.5)) drop-shadow(0 0 30px rgba(17, 24, 39, 0.2))"
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span 
                    className="text-4xl font-bold"
                    style={{ 
                      fontFamily: "'Playfair Display', serif",
                      color: "#111827"
                    }}
                  >
                    75<span className="text-xl align-top">%</span>
                  </span>
                  <span 
                    className="text-[9px] font-bold tracking-widest uppercase mt-1"
                    style={{ color: "#6B7280" }}
                  >
                    Optimization
                  </span>
                </div>
              </div>
              <p 
                className="text-xs text-center font-medium italic"
                style={{ color: "#6B7280" }}
              >
                "Deep Work" state has the highest focus yield today.
              </p>
            </div>
          </div>

          {/* Timeline Section */}
          <div 
            className="rounded-3xl p-10 shadow-lg border opacity-0"
            style={{
              background: "rgba(255, 255, 255, 0.45)",
              backdropFilter: "blur(40px) saturate(200%)",
              WebkitBackdropFilter: "blur(40px) saturate(200%)",
              borderColor: "rgba(255, 255, 255, 0.6)",
              animation: "fadeInUp 0.8s ease-out 0.9s forwards"
            }}
          >
            <div className="flex items-center justify-between mb-10">
              <h3 
                className="text-xl italic font-medium"
                style={{ 
                  fontFamily: "'Playfair Display', serif",
                  color: "#111827"
                }}
              >
                State Usage Timeline
              </h3>
              <div className="flex gap-2">
                <span 
                  className="px-4 py-1.5 rounded-full text-[10px] font-bold border shadow-sm uppercase tracking-widest"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.6)",
                    borderColor: "rgba(255, 255, 255, 0.8)",
                    color: "#6B7280"
                  }}
                >
                  Last 24 Hours
                </span>
              </div>
            </div>

            <div className="relative pl-4 space-y-12">
              {/* Timeline Line */}
              <div 
                className="absolute left-[95px] top-4 bottom-4 w-px border-l border-dashed"
                style={{ borderColor: "rgba(209, 213, 219, 0.8)" }}
              />

              {/* Active State */}
              <div className="flex group relative">
                <div className="w-[95px] pr-8 text-right pt-1">
                  <span 
                    className="block text-sm font-bold"
                    style={{ 
                      fontFamily: "'Playfair Display', serif",
                      color: "#111827"
                    }}
                  >
                    14:00
                  </span>
                  <span 
                    className="block text-[10px] font-bold mt-1 tracking-wider uppercase opacity-70"
                    style={{ color: "#6B7280" }}
                  >
                    Active
                  </span>
                </div>
                <div className="relative flex-1">
                  <div 
                    className="absolute left-[-5.5px] top-2.5 w-3 h-3 rounded-full border-2 border-white z-10"
                    style={{ 
                      backgroundColor: "#111827",
                      boxShadow: "0 0 15px rgba(17, 24, 39, 0.3)"
                    }}
                  >
                    <div 
                      className="absolute inset-0 rounded-full opacity-25"
                      style={{ 
                        backgroundColor: "#111827",
                        animation: "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite"
                      }}
                    />
                  </div>
                  <div 
                    className="ml-8 p-6 rounded-2xl border shadow-sm group-hover:shadow-md transition-all duration-300 flex justify-between items-center backdrop-blur-sm relative overflow-hidden"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.6)",
                      borderColor: "white"
                    }}
                  >
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"
                    />
                    <div>
                      <h4 
                        className="font-bold flex items-center gap-2"
                        style={{ color: "#111827" }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                        Deep Work
                      </h4>
                      <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
                        Current environmental preset active for 1h 22m.
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div 
                          className="text-[10px] font-bold uppercase tracking-widest"
                          style={{ color: "#6B7280" }}
                        >
                          Focus Score
                        </div>
                        <div 
                          className="text-lg font-bold"
                          style={{ 
                            fontFamily: "'Playfair Display', serif",
                            color: "#111827"
                          }}
                        >
                          94/100
                        </div>
                      </div>
                      <button 
                        className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
                        style={{ color: "#111827" }}
                        onClick={handleRefreshState}
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Past State */}
              <div className="flex group relative opacity-60 hover:opacity-100 transition-opacity">
                <div className="w-[95px] pr-8 text-right pt-1">
                  <span 
                    className="block text-sm font-bold"
                    style={{ 
                      fontFamily: "'Playfair Display', serif",
                      color: "#111827"
                    }}
                  >
                    12:30
                  </span>
                  <span 
                    className="block text-[10px] font-bold mt-1 tracking-wider uppercase opacity-70"
                    style={{ color: "#6B7280" }}
                  >
                    1.5h
                  </span>
                </div>
                <div className="relative flex-1">
                  <div 
                    className="absolute left-[-4.5px] top-2.5 w-2.5 h-2.5 rounded-full bg-gray-300 border-2 border-white z-10"
                  />
                  <div 
                    className="ml-8 p-6 rounded-2xl border border-dashed flex justify-between items-center backdrop-blur-sm"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.3)",
                      borderColor: "#E5E7EB"
                    }}
                  >
                    <div>
                      <h4 className="font-bold" style={{ color: "#6B7280" }}>
                        Creative Flow
                      </h4>
                      <p className="text-xs mt-1" style={{ color: "rgba(107, 114, 128, 0.7)" }}>
                        Completed brainstorming session.
                      </p>
                    </div>
                    <History className="w-5 h-5" style={{ color: "rgba(107, 114, 128, 0.3)" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="h-24" />
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes settle {
          0% { letter-spacing: 0.05em; opacity: 0; }
          100% { letter-spacing: 0; opacity: 1; }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(17, 24, 39, 0.2); }
          50% { transform: scale(1.03); box-shadow: 0 0 35px rgba(17, 24, 39, 0.4); }
        }
        @keyframes dash {
          to { stroke-dashoffset: 0; }
        }
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        .sparkline-path {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
        }
      `}</style>

      {/* Focus Flow Modal */}
      {showFocusFlowModal && (
        <FocusFlowModal 
          isOpen={showFocusFlowModal}
          onClose={() => setShowFocusFlowModal(false)}
        />
      )}
    </div>
  );
}