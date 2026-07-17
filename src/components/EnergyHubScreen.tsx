import { useState, useEffect } from "react";
import {
  Zap, TrendingUp, Clock, Info, Lightbulb, Heart, BarChart3, Sparkles,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useEnergyTracking } from "../hooks/useEnergyTracking";
import { ScreenHeader, SCREEN_ANIMATIONS } from "./ui/ScreenHeader";

export function EnergyHubScreen() {
  const [viewMode, setViewMode] = useState<"today" | "week">("today");
  const [hasLogged, setHasLogged] = useState(false);
  const navigate = useNavigate();

  const {
    currentEnergy,
    setCurrentEnergy,
    logEnergy,
    getEnergyLabel,
    getEnergyColor,
    getTodayChartData,
    getWeekChartData,
    generateSVGPath,
    getAISuggestions,
    stats,
  } = useEnergyTracking();

  const [energyLevel, setEnergyLevel] = useState(currentEnergy);

  useEffect(() => {
    setEnergyLevel(currentEnergy);
  }, [currentEnergy]);

  // Get emoji based on energy level
  const getEnergyEmoji = (level: number): string => {
    if (level < 20) return "😴";
    if (level < 35) return "😔";
    if (level < 50) return "😐";
    if (level < 65) return "🙂";
    if (level < 80) return "😊";
    if (level < 90) return "😁";
    return "🔥";
  };

  const handleScheduleSuggestion = (title: string, time: string) => {
    toast.success(`"${title}" scheduled at ${time}`, {
      description: "Added to your calendar based on energy prediction.",
    });
  };

  const handleLogEnergy = () => {
    logEnergy(energyLevel);               // saves to localStorage via hook
    setCurrentEnergy(energyLevel);
    setHasLogged(true);
    toast.success(`Energy logged at ${energyLevel}% (${getEnergyLabel(energyLevel)})`);
    setTimeout(() => setHasLogged(false), 3000);
  };

  // Prepare recharts data
  const chartDataRaw = viewMode === "today" ? getTodayChartData() : getWeekChartData();
  const hasChartData = chartDataRaw.some(d => d.energy > 0);

  return (
    <div className="flex-1 overflow-y-auto scroll-smooth" style={{ backgroundColor: "#F8F9FA" }}>
      {/* Header */}
      <ScreenHeader
        label="Energy Hub"
        title="Energy & Focus"
        extras={
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
            style={{
              backgroundColor: "rgba(255,255,255,0.6)",
              borderColor: "rgba(255,255,255,0.8)",
            }}
          >
            <Zap
              className="w-3.5 h-3.5"
              style={{ color: "#EA580C", filter: "drop-shadow(0 0 6px rgba(234,88,12,0.3))" }}
            />
            <span className="text-xs font-bold tracking-wide" style={{ color: "#111827" }}>
              {energyLevel >= 60 ? "HIGH" : energyLevel >= 40 ? "MODERATE" : "LOW"} ENERGY
            </span>
          </div>
        }
      />

      {/* Main Content */}
      <div className="p-10">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Energy Input Section */}
          <div 
            className="rounded-3xl p-10 shadow-lg transition-all duration-500 opacity-0"
            style={{
              background: "rgba(255, 255, 255, 0.55)",
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
              border: "1px solid rgba(255, 255, 255, 0.4)",
              animation: "fadeInUp 0.8s ease-out 0.1s forwards"
            }}
          >
            <div className="flex flex-col md:flex-row gap-12 items-center">
              {/* Left Side - Slider Controls */}
              <div className="flex-1 space-y-6">
                <h2 
                  className="text-4xl font-medium tracking-tight leading-tight"
                  style={{ 
                    fontFamily: "'Playfair Display', serif",
                    color: "#111827"
                  }}
                >
                  How is your energy right now?
                </h2>
                <p 
                  className="text-lg font-light leading-relaxed max-w-md"
                  style={{ color: "#6B7280" }}
                >
                  Your input calibrates the AI scheduler to optimize your peak performance windows.
                </p>

                {/* Energy Slider */}
                <div className="relative pt-8 pb-4">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-2 px-1" style={{ color: "#6B7280" }}>
                    <span>Low</span>
                    <span>Zen</span>
                    <span>High</span>
                  </div>
                  
                  <div className="relative h-12 flex items-center group">
                    {/* Track Background */}
                    <div 
                      className="absolute inset-x-0 h-3 rounded-full overflow-hidden shadow-inner"
                      style={{ backgroundColor: "#F3F4F6" }}
                    >
                      {/* Filled Track */}
                      <div 
                        className="h-full rounded-full relative transition-all duration-300"
                        style={{
                          width: `${energyLevel}%`,
                          background: "linear-gradient(90deg, #FCD34D 0%, #F59E0B 50%, #B45309 100%)"
                        }}
                      >
                        <div 
                          className="absolute inset-0 opacity-30"
                          style={{
                            background: "white",
                            animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
                          }}
                        />
                      </div>
                    </div>

                    {/* Knob */}
                    <div 
                      className="absolute w-10 h-10 bg-white rounded-full transform -translate-x-1/2 cursor-grab active:cursor-grabbing hover:scale-110 transition-transform z-20 flex items-center justify-center text-xl"
                      style={{
                        left: `${energyLevel}%`,
                        boxShadow: "0 0 0 4px rgba(255, 255, 255, 1), 0 0 20px rgba(245, 158, 11, 0.4)"
                      }}
                    >
                      {getEnergyEmoji(energyLevel)}
                    </div>

                    {/* Actual Input */}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={energyLevel}
                      onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer z-30"
                      style={{ height: "48px" }}
                    />
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex gap-4 pt-2">
                  <div 
                    className="px-4 py-2 rounded-xl border text-xs font-bold tracking-wide flex items-center gap-2"
                    style={{
                      backgroundColor: "#FFFBEB",
                      borderColor: "#FED7AA",
                      color: "#92400E"
                    }}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    Peaking Soon
                  </div>
                  <div
                    className="px-4 py-2 rounded-xl border text-xs font-bold tracking-wide flex items-center gap-2"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.5)",
                      borderColor: "white",
                      color: "#6B7280",
                    }}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Next Check-in: {stats.nextCheckIn}
                  </div>
                  <button
                    onClick={handleLogEnergy}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white transition-all duration-300 flex items-center gap-2 hover:scale-105 active:scale-95 shadow-md"
                    style={{ 
                      backgroundColor: hasLogged ? "#10B981" : "#111827",
                    }}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    {hasLogged ? "Logged!" : "Log Energy"}
                  </button>
                </div>
              </div>

              {/* Right Side - Visual Indicator */}
              <div className="w-full md:w-1/3 relative flex justify-center">
                <div className="relative w-64 h-64">
                  {/* Animated Gradient Blobs */}
                  <div 
                    className="absolute inset-0 rounded-full mix-blend-multiply filter blur-2xl opacity-40"
                    style={{
                      background: "linear-gradient(to top right, #FDE68A, #FCD34D, #FDE68A)",
                      animation: "float 6s ease-in-out infinite"
                    }}
                  />
                  <div 
                    className="absolute top-4 left-4 right-4 bottom-4 rounded-full mix-blend-multiply filter blur-xl opacity-40"
                    style={{
                      background: "linear-gradient(to bottom left, #FED7AA, #FCD34D, #FDE68A)",
                      animation: "float 6s ease-in-out infinite",
                      animationDelay: "2s"
                    }}
                  />

                  {/* Center Content */}
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="text-center relative">
                      <div 
                        className="text-6xl font-bold mix-blend-overlay"
                        style={{ 
                          fontFamily: "'Playfair Display', serif",
                          color: "#111827"
                        }}
                      >
                        {energyLevel}
                        <span className="text-2xl align-top">%</span>
                      </div>
                      <div 
                        className="text-xs font-bold uppercase tracking-[0.2em] mt-2"
                        style={{ color: "rgba(17, 24, 39, 0.6)" }}
                      >
                        Current Level
                      </div>
                      
                      {/* Floating Icon */}
                      <div 
                        className="absolute -right-8 -top-8"
                        style={{ animation: "bounce 3s ease-in-out infinite" }}
                      >
                        <Zap 
                          className="w-10 h-10 opacity-50" 
                          style={{ color: "#F59E0B" }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Decorative SVG */}
                  <svg 
                    className="absolute inset-0 w-full h-full opacity-20" 
                    viewBox="0 0 100 100"
                    style={{ transform: "rotate(12deg)" }}
                  >
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeDasharray="4 4" 
                      strokeWidth="0.5" 
                    />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="30" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="0.5" 
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Chart and Suggestions Row */}
          <div className="grid grid-cols-12 gap-8">
            {/* Energy vs Output Chart */}
            <div 
              className="col-span-12 lg:col-span-7 rounded-3xl p-8 opacity-0"
              style={{
                background: "rgba(255, 255, 255, 0.55)",
                backdropFilter: "blur(24px) saturate(180%)",
                WebkitBackdropFilter: "blur(24px) saturate(180%)",
                border: "1px solid rgba(255, 255, 255, 0.4)",
                boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)",
                animation: "fadeInUp 0.8s ease-out 0.2s forwards"
              }}
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 
                    className="text-xl font-medium flex items-center gap-2"
                    style={{ 
                      fontFamily: "'Playfair Display', serif",
                      color: "#111827"
                    }}
                  >
                    Energy vs. Output
                    <Info className="w-4 h-4 opacity-50 cursor-help" style={{ color: "#6B7280" }} />
                  </h3>
                  <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
                    Correlation analysis over the last 8 hours.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode("today")}
                    className={`px-3 py-1 text-xs font-bold rounded-lg shadow-md transition-colors ${
                      viewMode === "today" 
                        ? "text-white" 
                        : "hover:bg-white/50"
                    }`}
                    style={{
                      backgroundColor: viewMode === "today" ? "#111827" : "transparent",
                      color: viewMode === "today" ? "white" : "#6B7280"
                    }}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setViewMode("week")}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                      viewMode === "week"
                        ? "text-white"
                        : "hover:bg-white/50"
                    }`}
                    style={{
                      backgroundColor: viewMode === "week" ? "#111827" : "transparent",
                      color: viewMode === "week" ? "white" : "#6B7280"
                    }}
                  >
                    Week
                  </button>
                </div>
              </div>

              {/* Chart Area — recharts */}
              <div className="relative w-full mt-4" style={{ height: 256 }}>
                {hasChartData ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={256}>
                    <AreaChart data={chartDataRaw} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="energyFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#F59E0B" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}   />
                        </linearGradient>
                        <linearGradient id="productivityFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#10B981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}   />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" stroke="rgba(0,0,0,0.06)" vertical={false} />
                      <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} unit="%" />
                      <Tooltip
                        contentStyle={{ background: "#111827", border: "none", borderRadius: 12, color: "white", fontSize: 12 }}
                        labelStyle={{ color: "#9CA3AF" }}
                      />
                      <Area type="monotone" dataKey="productivity" name="Productivity" stroke="#10B981" strokeDasharray="6 4" strokeWidth={2} fill="url(#productivityFill)" />
                      <Area type="monotone" dataKey="energy"       name="Energy"       stroke="#F59E0B" strokeWidth={3} fill="url(#energyFill)"
                        dot={{ r: 4, fill: "#fff", stroke: "#F59E0B", strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: "#F59E0B" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-3" style={{ color: "#9CA3AF" }}>
                    <Zap className="w-10 h-10 opacity-30" style={{ color: "#F59E0B" }} />
                    <p className="text-sm">No energy logs yet</p>
                    <p className="text-xs opacity-70">Use the slider above to log your energy — chart updates instantly</p>
                  </div>
                )}
              </div>
            </div>

            {/* AI Suggestions */}
            <div 
              className="col-span-12 lg:col-span-5 flex flex-col gap-4 opacity-0"
              style={{ animation: "fadeInUp 0.8s ease-out 0.3s forwards" }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 
                  className="text-lg italic font-medium"
                  style={{ 
                    fontFamily: "'Playfair Display', serif",
                    color: "#111827"
                  }}
                >
                  AI Scheduling Suggestions
                </h3>
                <span 
                  className="text-[10px] font-bold px-2 py-1 rounded uppercase"
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.05)",
                    color: "#6B7280"
                  }}
                >
                  Based on Energy
                </span>
              </div>

              {/* Suggestion Cards */}
              {energyLevel >= 70 ? (
                <>
                  <SuggestionCard
                    icon={<Lightbulb className="w-4.5 h-4.5" style={{ color: "#F59E0B" }} />}
                    title="Deep Focus Block"
                    description="Your energy is peaking. Perfect time for complex problem solving."
                    time="14:00"
                    duration="90 min"
                    impact="High Impact"
                    accentColor="#F59E0B"
                    badgeColor={{ bg: "#FFFBEB", text: "#B45309", border: "#FED7AA" }}
                    onClick={() => handleScheduleSuggestion("Deep Focus Block", "14:00")}
                  />

                  <SuggestionCard
                    icon={<Heart className="w-4.5 h-4.5" style={{ color: "#10B981" }} />}
                    title="Team Sync"
                    description="Social energy is stable. Good for collaborative tasks."
                    time="16:00"
                    duration="30 min"
                    impact="Collaborative"
                    accentColor="#10B981"
                    badgeColor={{ bg: "#ECFDF5", text: "#065F46", border: "#A7F3D0" }}
                    onClick={() => handleScheduleSuggestion("Team Sync", "16:00")}
                  />
                </>
              ) : energyLevel >= 50 ? (
                <>
                  <SuggestionCard
                    icon={<Heart className="w-4.5 h-4.5" style={{ color: "#10B981" }} />}
                    title="Team Sync"
                    description="Moderate energy. Good for collaborative and communication tasks."
                    time="14:30"
                    duration="45 min"
                    impact="Collaborative"
                    accentColor="#10B981"
                    badgeColor={{ bg: "#ECFDF5", text: "#065F46", border: "#A7F3D0" }}
                    onClick={() => handleScheduleSuggestion("Team Sync", "14:30")}
                  />

                  <SuggestionCard
                    icon={<Lightbulb className="w-4.5 h-4.5" style={{ color: "#3B82F6" }} />}
                    title="Light Creative Work"
                    description="Energy is stable. Perfect for brainstorming and creative tasks."
                    time="15:30"
                    duration="60 min"
                    impact="Creative"
                    accentColor="#3B82F6"
                    badgeColor={{ bg: "#EFF6FF", text: "#1E40AF", border: "#BFDBFE" }}
                    onClick={() => handleScheduleSuggestion("Light Creative Work", "15:30")}
                  />
                </>
              ) : energyLevel >= 30 ? (
                <>
                  <SuggestionCard
                    icon={<Heart className="w-4.5 h-4.5" style={{ color: "#60A5FA" }} />}
                    title="Short Recharge Break"
                    description="Energy is moderate-low. Take a 15-minute walk or meditation."
                    time="Now"
                    duration="15 min"
                    impact="Recovery"
                    accentColor="#93C5FD"
                    badgeColor={{ bg: "#EFF6FF", text: "#1E40AF", border: "#BFDBFE" }}
                    onClick={() => handleScheduleSuggestion("Recharge Break", "Now")}
                  />

                  <SuggestionCard
                    icon={<Heart className="w-4.5 h-4.5" style={{ color: "#10B981" }} />}
                    title="Admin Tasks"
                    description="Low cognitive load tasks like email and scheduling."
                    time="15:00"
                    duration="30 min"
                    impact="Low Priority"
                    accentColor="#6B7280"
                    badgeColor={{ bg: "#F3F4F6", text: "#6B7280", border: "#E5E7EB" }}
                    opacity={0.8}
                    onClick={() => handleScheduleSuggestion("Admin Tasks", "15:00")}
                  />
                </>
              ) : (
                <>
                  <SuggestionCard
                    icon={<Heart className="w-4.5 h-4.5" style={{ color: "#EF4444" }} />}
                    title="Energy Recovery"
                    description="Energy is low. Take a longer break or consider ending early."
                    time="Now"
                    duration="30 min"
                    impact="Critical"
                    accentColor="#EF4444"
                    badgeColor={{ bg: "#FEE2E2", text: "#991B1B", border: "#FECACA" }}
                    onClick={() => handleScheduleSuggestion("Recovery Break", "Now")}
                  />

                  <SuggestionCard
                    icon={<Heart className="w-4.5 h-4.5" style={{ color: "#60A5FA" }} />}
                    title="Decompression"
                    description="Scheduled downtime to prevent burnout."
                    time="After break"
                    duration="Flexible"
                    impact="Recovery"
                    accentColor="#93C5FD"
                    badgeColor={{ bg: "#EFF6FF", text: "#1E40AF", border: "#BFDBFE" }}
                    opacity={0.6}
                    onClick={() => handleScheduleSuggestion("Decompression", "After break")}
                  />
                </>
              )}
            </div>
          </div>

          {/* Weekly Insight Banner */}
          <div 
            className="rounded-2xl p-4 flex items-center justify-between gap-4 opacity-0"
            style={{
              background: "rgba(255, 255, 255, 0.55)",
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
              border: "1px solid rgba(255, 255, 255, 0.4)",
              animation: "fadeInUp 0.8s ease-out 0.4s forwards"
            }}
          >
            <div className="flex items-center gap-4">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: "rgba(17, 24, 39, 0.05)" }}
              >
                <BarChart3 className="w-5 h-5" style={{ color: "#111827" }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "#111827" }}>
                  Weekly Insight
                </p>
                <p className="text-xs" style={{ color: "#6B7280" }}>
                  {stats.weeklyInsight}
                </p>
              </div>
            </div>
            <button 
              onClick={() => navigate("/insights")}
              className="px-5 py-2.5 border rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 group"
              style={{
                backgroundColor: "#111827",
                borderColor: "#111827",
                color: "white",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#000000";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#111827";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)";
              }}
            >
              <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              Weekly Insights
            </button>
          </div>
        </div>
        
        <div className="h-24" />
      </div>

      {/* Animations */}
      <style>{`
        ${SCREEN_ANIMATIONS}
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}

interface SuggestionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  time: string;
  duration: string;
  impact: string;
  accentColor: string;
  badgeColor: { bg: string; text: string; border: string };
  opacity?: number;
  onClick?: () => void;
}

function SuggestionCard({
  icon,
  title,
  description,
  time,
  duration,
  impact,
  accentColor,
  badgeColor,
  opacity = 1,
  onClick
}: SuggestionCardProps) {
  return (
    <div 
      className="p-5 rounded-2xl border hover:bg-white/80 transition-all duration-300 group cursor-pointer shadow-sm hover:shadow-lg relative overflow-hidden"
      style={{
        background: "rgba(255, 255, 255, 0.55)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderColor: "rgba(255, 255, 255, 0.6)",
        opacity
      }}
      onClick={onClick}
    >
      <div 
        className="absolute left-0 top-0 bottom-0 w-1 group-hover:w-1.5 transition-all"
        style={{ backgroundColor: accentColor }}
      />
      
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {icon}
            <h4 className="font-bold text-sm" style={{ color: "#111827" }}>
              {title}
            </h4>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>
            {description}
          </p>
        </div>
        <span 
          className="text-xs font-bold font-mono px-2 py-1 rounded"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.5)",
            color: "#111827"
          }}
        >
          {time}
        </span>
      </div>

      <div className="mt-3 flex gap-2">
        <span 
          className="text-[10px] px-2 py-0.5 rounded border"
          style={{
            backgroundColor: "#F3F4F6",
            color: "#6B7280",
            borderColor: "#E5E7EB"
          }}
        >
          {duration}
        </span>
        <span 
          className="text-[10px] px-2 py-0.5 rounded border"
          style={{
            backgroundColor: badgeColor.bg,
            color: badgeColor.text,
            borderColor: badgeColor.border
          }}
        >
          {impact}
        </span>
      </div>
    </div>
  );
}