import { useState } from "react";
import { X, Plus, Search, MessageSquare, Code, Headphones, BellOff, Waves, Rocket } from "lucide-react";
import { useNavigate } from "react-router";
import { storageService } from "../services/storage-service";
import { toast } from "sonner@2.0.3";

interface FocusFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AppIntegration {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  enabled: boolean;
  status?: "online" | "offline";
}

export function FocusFlowModal({ isOpen, onClose }: FocusFlowModalProps) {
  const [sessionName, setSessionName] = useState("Deep Creative Work");
  const [showAppSearch, setShowAppSearch] = useState(false);
  const [selectedDays, setSelectedDays] = useState([0, 1, 2, 3, 4]); // Mon-Fri
  const [muteAll, setMuteAll] = useState(true);
  const [rainfall, setRainfall] = useState(true);
  const [startTime, setStartTime] = useState(9);
  const [endTime, setEndTime] = useState(17);
  const navigate = useNavigate();

  const [apps, setApps] = useState<AppIntegration[]>([
    {
      id: "slack",
      name: "Slack",
      icon: <MessageSquare className="w-6 h-6" />,
      color: "#4A154B",
      enabled: true,
      status: "online"
    },
    {
      id: "vscode",
      name: "VS Code",
      icon: <Code className="w-6 h-6" />,
      color: "#2563EB",
      enabled: true
    },
    {
      id: "spotify",
      name: "Spotify",
      icon: <Headphones className="w-6 h-6" />,
      color: "#16A34A",
      enabled: true
    }
  ]);

  const days = ["M", "T", "W", "T", "F", "S", "S"];

  const toggleApp = (id: string) => {
    setApps(apps.map(app => 
      app.id === id ? { ...app, enabled: !app.enabled } : app
    ));
  };

  const toggleDay = (index: number) => {
    if (selectedDays.includes(index)) {
      setSelectedDays(selectedDays.filter(d => d !== index));
    } else {
      setSelectedDays([...selectedDays, index].sort());
    }
  };

  const setWorkdays = () => {
    setSelectedDays([0, 1, 2, 3, 4]);
  };

  const setWeekends = () => {
    setSelectedDays([5, 6]);
  };

  const handleInitializeSession = () => {
    // Create and save a focus session
    const session = {
      id: `session-${Date.now()}`,
      title: sessionName || 'Focus Session',
      startTime: Date.now(),
      duration: 0,
      taskIds: [],
      focusScore: 0,
      energyLevels: [],
      contextSwitches: 0,
      mood: 'focused' as const,
    };
    storageService.setCurrentSession(session);
    toast.success(`"${sessionName}" session initialized!`);
    onClose();
    navigate("/focus");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/5 backdrop-blur-3xl">
      {/* Blurred Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-60 mix-blend-overlay" 
        style={{
          backgroundImage: `url('data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)" opacity="0.05"/%3E%3C/svg%3E')`
        }}
      />

      {/* Modal Panel */}
      <div 
        className="w-full max-w-xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col relative z-10"
        style={{
          background: "rgba(255, 255, 255, 0.45)",
          backdropFilter: "blur(40px) saturate(200%)",
          WebkitBackdropFilter: "blur(40px) saturate(200%)",
          border: "1px solid rgba(255, 255, 255, 0.5)",
          boxShadow: "0 48px 144px -24px rgba(0, 0, 0, 0.18)"
        }}
      >
        {/* Shimmer Effect */}
        <div 
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            background: "linear-gradient(110deg, rgba(255,255,255,0.8), rgba(255,255,255,0.1) 40%, rgba(255,255,255,0.05) 60%, rgba(255,255,255,0.7))",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            padding: "1px",
            opacity: 0.8
          }}
        />

        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex justify-between items-start flex-shrink-0">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: "rgba(17, 24, 39, 0.4)" }}>
              Quick Setup
            </span>
            <h2 
              className="text-2xl font-medium italic"
              style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
            >
              Build Your Focus Session
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/50 border border-white flex items-center justify-center transition-colors"
            style={{ color: "rgba(17, 24, 39, 0.4)" }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#111827"}
            onMouseLeave={(e) => e.currentTarget.style.color = "rgba(17, 24, 39, 0.4)"}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 space-y-6 overflow-y-auto flex-1"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(17, 24, 39, 0.2) transparent"
          }}
        >
          {/* Session Name */}
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="Name your flow..."
                className="w-full bg-transparent border-0 border-b-2 focus:ring-0 px-0 py-3 text-3xl transition-all italic placeholder-opacity-20"
                style={{ 
                  fontFamily: "'Playfair Display', serif",
                  color: "#111827",
                  borderBottomColor: "rgba(17, 24, 39, 0.05)"
                }}
                onFocus={(e) => e.currentTarget.style.borderBottomColor = "#111827"}
                onBlur={(e) => e.currentTarget.style.borderBottomColor = "rgba(17, 24, 39, 0.05)"}
              />
              <div className="absolute right-0 bottom-4">
                <span className="text-xl" style={{ color: "rgba(17, 24, 39, 0.3)" }}>✎</span>
              </div>
            </div>
          </div>

          {/* Included Apps */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-[0.15em] flex items-center gap-2" style={{ color: "#6B7280" }}>
                <span className="w-4 h-px opacity-30" style={{ backgroundColor: "#6B7280" }}></span> 
                Included Apps
              </label>
              <div className="relative">
                <button 
                  onMouseEnter={() => setShowAppSearch(true)}
                  onMouseLeave={() => setShowAppSearch(false)}
                  className="flex items-center gap-2 text-[11px] font-bold bg-white/50 px-3 py-1.5 rounded-full border border-white shadow-sm hover:bg-white transition-all"
                  style={{ color: "#111827" }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Integration
                </button>

                {/* Dropdown */}
                {showAppSearch && (
                  <div 
                    className="absolute right-0 top-full mt-2 w-56 bg-white/95 backdrop-blur-xl border border-white/60 rounded-2xl p-3 z-50 transition-all"
                    style={{ boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                    onMouseEnter={() => setShowAppSearch(true)}
                    onMouseLeave={() => setShowAppSearch(false)}
                  >
                    <div className="relative mb-2">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#6B7280" }} />
                      <input
                        type="text"
                        placeholder="Search apps..."
                        className="w-full bg-gray-50 border-0 rounded-lg pl-8 py-1.5 text-xs focus:ring-1"
                        style={{ 
                          focusRingColor: "rgba(17, 24, 39, 0.2)"
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
                        <div className="w-5 h-5 bg-gray-200 rounded flex items-center justify-center text-[10px]">
                          📝
                        </div>
                        <span className="text-[11px] font-medium">Notion</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
                        <div className="w-5 h-5 bg-gray-200 rounded flex items-center justify-center text-[10px]">
                          🎨
                        </div>
                        <span className="text-[11px] font-medium">Figma</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* App Cards */}
            <div className="flex gap-4 overflow-x-auto pb-4 pt-1 -mx-2 px-2">
              {apps.map((app) => (
                <div
                  key={app.id}
                  className="flex-shrink-0 w-36 bg-white/40 p-4 rounded-[1.5rem] border border-white/80 shadow-sm flex flex-col items-center gap-3 relative transition-all hover:bg-white/60"
                >
                  {app.status === "online" && (
                    <div className="absolute top-3 right-3">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>
                  )}
                  <div 
                    className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center"
                    style={{ color: app.color }}
                  >
                    {app.icon}
                  </div>
                  <p className="text-[11px] font-bold uppercase" style={{ color: "#111827" }}>
                    {app.name}
                  </p>
                  <button
                    onClick={() => toggleApp(app.id)}
                    className="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none scale-75"
                    style={{ backgroundColor: app.enabled ? "#111827" : "#E5E7EB" }}
                  >
                    <span
                      className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                      style={{ transform: app.enabled ? "translateX(1rem)" : "translateX(0)" }}
                    />
                  </button>
                </div>
              ))}

              {/* Add More */}
              <div className="flex-shrink-0 w-36 p-4 rounded-[1.5rem] border-2 border-dashed flex flex-col items-center justify-center gap-2 opacity-40 hover:opacity-70 transition-all cursor-pointer"
                style={{ borderColor: "rgba(17, 24, 39, 0.05)" }}
              >
                <Plus className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-6">
            <label className="text-[11px] font-bold uppercase tracking-[0.15em] flex items-center gap-2" style={{ color: "#6B7280" }}>
              <span className="w-4 h-px opacity-30" style={{ backgroundColor: "#6B7280" }}></span> 
              03. Activate On
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Days Selection */}
              <div className="space-y-4">
                <div className="flex gap-2 justify-between">
                  <button
                    onClick={setWorkdays}
                    className="flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all"
                    style={{
                      backgroundColor: JSON.stringify(selectedDays) === JSON.stringify([0, 1, 2, 3, 4]) ? "#111827" : "rgba(255, 255, 255, 0.3)",
                      color: JSON.stringify(selectedDays) === JSON.stringify([0, 1, 2, 3, 4]) ? "white" : "#6B7280",
                      border: JSON.stringify(selectedDays) === JSON.stringify([0, 1, 2, 3, 4]) ? "none" : "1px solid white"
                    }}
                  >
                    Workdays
                  </button>
                  <button
                    onClick={setWeekends}
                    className="flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all"
                    style={{
                      backgroundColor: JSON.stringify(selectedDays) === JSON.stringify([5, 6]) ? "#111827" : "rgba(255, 255, 255, 0.3)",
                      color: JSON.stringify(selectedDays) === JSON.stringify([5, 6]) ? "white" : "#6B7280",
                      border: JSON.stringify(selectedDays) === JSON.stringify([5, 6]) ? "none" : "1px solid white"
                    }}
                  >
                    Weekends
                  </button>
                </div>

                <div className="flex justify-between px-1">
                  {days.map((day, index) => (
                    <button
                      key={index}
                      onClick={() => toggleDay(index)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-all"
                      style={{
                        backgroundColor: selectedDays.includes(index) ? "#111827" : "rgba(255, 255, 255, 0.4)",
                        color: selectedDays.includes(index) ? "white" : "#6B7280",
                        border: selectedDays.includes(index) ? "none" : "1px solid rgba(255, 255, 255, 0.6)"
                      }}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Range */}
              <div className="space-y-4 px-2">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest" style={{ color: "#111827" }}>
                  <span>Start: {String(startTime).padStart(2, '0')}:00 {startTime >= 12 ? 'PM' : 'AM'}</span>
                  <span>End: {String(endTime).padStart(2, '0')}:00 {endTime >= 12 ? 'PM' : 'AM'}</span>
                </div>

                <div className="relative h-6 flex items-center">
                  {/* Track */}
                  <div className="absolute top-1/2 -translate-y-1/2 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                    {/* Selected Range */}
                    <div 
                      className="absolute top-0 h-full"
                      style={{
                        left: `${(startTime / 24) * 100}%`,
                        right: `${100 - (endTime / 24) * 100}%`,
                        backgroundColor: "rgba(17, 24, 39, 0.2)"
                      }}
                    />
                  </div>

                  {/* Start Thumb */}
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md cursor-pointer z-10"
                    style={{ 
                      left: `${(startTime / 24) * 100}%`,
                      border: "2px solid #111827"
                    }}
                  />

                  {/* End Thumb */}
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md cursor-pointer z-10"
                    style={{ 
                      left: `${(endTime / 24) * 100}%`,
                      border: "2px solid #111827"
                    }}
                  />
                </div>

                <div className="flex justify-between text-[9px] font-medium opacity-60" style={{ color: "#6B7280" }}>
                  <span>12 AM</span>
                  <span>12 PM</span>
                  <span>11 PM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Environment Sync */}
          <div className="space-y-4">
            <label className="text-[11px] font-bold uppercase tracking-[0.15em] flex items-center gap-2" style={{ color: "#6B7280" }}>
              <span className="w-4 h-px opacity-30" style={{ backgroundColor: "#6B7280" }}></span> 
              04. Environment Sync
            </label>

            <div className="flex gap-4">
              {/* Mute All */}
              <div className="flex-1 bg-white/30 p-4 rounded-2xl border border-white/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BellOff className="w-5 h-5" style={{ color: "rgba(17, 24, 39, 0.6)" }} />
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#111827" }}>
                    Mute All
                  </span>
                </div>
                <button
                  onClick={() => setMuteAll(!muteAll)}
                  className="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none scale-90"
                  style={{ backgroundColor: muteAll ? "#111827" : "#E5E7EB" }}
                >
                  <span
                    className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                    style={{ transform: muteAll ? "translateX(1rem)" : "translateX(0)" }}
                  />
                </button>
              </div>

              {/* Rainfall */}
              <div className="flex-1 bg-white/30 p-4 rounded-2xl border border-white/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Waves className="w-5 h-5" style={{ color: "rgba(17, 24, 39, 0.6)" }} />
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#111827" }}>
                    Rainfall
                  </span>
                </div>
                <button
                  onClick={() => setRainfall(!rainfall)}
                  className="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none scale-90"
                  style={{ backgroundColor: rainfall ? "#111827" : "#E5E7EB" }}
                >
                  <span
                    className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                    style={{ transform: rainfall ? "translateX(1rem)" : "translateX(0)" }}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 bg-white/20 border-t border-white/40 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#111827" }}></span>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#111827" }}>
              System Ready
            </span>
          </div>

          <button 
            className="text-white px-8 py-3 rounded-full font-bold text-xs uppercase tracking-widest transition-all duration-300 active:scale-95 group"
            style={{ 
              backgroundColor: "#111827",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#000000"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#111827"}
            onClick={handleInitializeSession}
          >
            <span className="flex items-center gap-2">
              Initialize Session
              <Rocket className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}