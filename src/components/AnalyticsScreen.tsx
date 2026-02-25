import { useState } from "react";
import {
  Brain, PieChart, Target, Filter,
  Mail, MessageSquare, Users, RotateCw, TrendingUp, Clock,
  CheckCircle2, Zap, Sparkles, Calendar
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from "recharts";
import { TimelineScreen } from "./TimelineScreen";
import { toast } from "sonner@2.0.3";
import { useAnalytics } from "../hooks/useAnalytics";
import { ScreenHeader, SCREEN_ANIMATIONS } from "./ui/ScreenHeader";

type TimeRange = "daily" | "weekly" | "monthly";

// ─── Custom recharts tooltip ──────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#111827", borderRadius: 12, padding: "10px 14px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)"
    }}>
      <p style={{ color: "#9CA3AF", fontSize: 11, marginBottom: 6 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color, fontSize: 12, fontWeight: 600 }}>
          {p.name}: {Number(p.value).toFixed(1)}h
        </p>
      ))}
    </div>
  );
};

const EnergyTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#111827", borderRadius: 12, padding: "10px 14px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)"
    }}>
      <p style={{ color: "#9CA3AF", fontSize: 11, marginBottom: 6 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color, fontSize: 12, fontWeight: 600 }}>
          {p.name}: {Number(p.value).toFixed(0)} min
        </p>
      ))}
    </div>
  );
};

export function AnalyticsScreen() {
  const [timeRange, setTimeRange] = useState<TimeRange>("weekly");
  const [activeTab, setActiveTab] = useState<"analytics" | "timeline">("analytics");

  const { metrics, chartData, cognitiveLoadBars, lastUpdated, refresh, loading } = useAnalytics(timeRange);

  const handleRefreshData = () => { refresh(); toast.success("Analytics refreshed"); };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: "#F8F9FA" }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-7 w-7 border-b-2 border-gray-900 mb-3" />
          <p className="text-sm" style={{ color: "#9CA3AF" }}>Loading analytics</p>
        </div>
      </div>
    );
  }

  const hasSessions = chartData.some(d => d.deepWork > 0 || d.shallowWork > 0);
  const totalInterruptions = metrics.interruptions.email + metrics.interruptions.slack + metrics.interruptions.meetings;

  // Convert chartData to recharts-friendly format
  const rechartsData = chartData.map(d => ({
    day:         d.day,
    "Deep Work": Math.round(d.deepWork * 10) / 10,
    "Shallow":   Math.round(d.shallowWork * 10) / 10,
  }));

  const peakHour = parseInt(metrics.peakPerformanceTime.split(":")[0]);
  const peakLabel = peakHour < 12 ? `${peakHour} AM` : peakHour === 12 ? "12 PM" : `${peakHour - 12} PM`;

  return (
    <div className="flex-1 flex flex-col" style={{ backgroundColor: "#F8F9FA" }}>

      {/* Header */}
      <ScreenHeader
        label="Analytics"
        title="Performance"
        actions={
          activeTab === "analytics" ? (
            <div className="flex items-center gap-1.5">
              {(["daily", "weekly", "monthly"] as TimeRange[]).map(range => (
                <button key={range} onClick={() => setTimeRange(range)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize"
                  style={{
                    background: timeRange === range ? "#111827" : "transparent",
                    color:      timeRange === range ? "white" : "#9CA3AF",
                    border:     timeRange === range ? "1px solid #111827" : "1px solid rgba(0,0,0,0.07)",
                  }}>
                  {range}
                </button>
              ))}
            </div>
          ) : undefined
        }
      />

      {/* Tab bar */}
      <div className="flex-shrink-0 border-b px-10 sticky top-24 z-10"
        style={{ backgroundColor: "rgba(255,255,255,0.85)", backdropFilter: "blur(14px)", borderColor: "rgba(0,0,0,0.06)" }}>
        <div className="flex items-center gap-1 max-w-7xl mx-auto">
          {[
            { key: "analytics" as const, label: "Analytics", icon: TrendingUp },
            { key: "timeline"  as const, label: "Timeline",  icon: Clock      },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-2 px-4 py-3.5 text-xs font-medium relative transition-colors"
                style={{ color: active ? "#111827" : "#9CA3AF" }}>
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full" style={{ backgroundColor: "#111827" }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {activeTab === "timeline" ? (
        <TimelineScreen />
      ) : (
        <div className="flex-1 overflow-y-auto p-10 scroll-smooth">
          <div className="max-w-7xl mx-auto space-y-8">

            {/* Title row */}
            <div className="opacity-0" style={{ animation: "fadeInUp 0.8s ease-out forwards" }}>
              <h2 className="text-3xl font-medium italic" style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}>
                {timeRange === "daily" ? "Today's" : timeRange === "weekly" ? "Weekly" : "Monthly"} Performance
              </h2>
              <p className="mt-1 text-sm" style={{ color: "#9CA3AF" }}>
                Last updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>

            {/* NEW: Comprehensive Productivity Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Tasks Completed */}
              <div className="p-5 rounded-2xl border opacity-0"
                style={{
                  background: "rgba(34,197,94,0.08)", backdropFilter: "blur(24px)",
                  borderColor: "rgba(34,197,94,0.2)",
                  boxShadow: "0 4px 16px rgba(34,197,94,0.1)",
                  animation: "fadeInUp 0.6s ease-out 0.05s forwards",
                }}>
                <div className="flex items-center justify-between mb-3">
                  <CheckCircle2 className="w-5 h-5" style={{ color: "#22C55E" }} />
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.15)", color: "#16A34A" }}>
                    {metrics.tasksCompletedToday} today
                  </span>
                </div>
                <p className="text-2xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}>
                  {metrics.tasksCompleted}
                </p>
                <p className="text-xs font-medium" style={{ color: "#6B7280" }}>
                  Tasks · {metrics.completionRate}% rate
                </p>
                {metrics.currentStreak > 0 && (
                  <div className="mt-2 flex items-center gap-1 text-xs" style={{ color: "#22C55E" }}>
                    <Calendar className="w-3 h-3" />
                    <span className="font-bold">{metrics.currentStreak} day streak</span>
                  </div>
                )}
              </div>

              {/* Energy Level */}
              <div className="p-5 rounded-2xl border opacity-0"
                style={{
                  background: "rgba(251,146,60,0.08)", backdropFilter: "blur(24px)",
                  borderColor: "rgba(251,146,60,0.2)",
                  boxShadow: "0 4px 16px rgba(251,146,60,0.1)",
                  animation: "fadeInUp 0.6s ease-out 0.1s forwards",
                }}>
                <div className="flex items-center justify-between mb-3">
                  <Zap className="w-5 h-5" style={{ color: "#FB923C" }} />
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${metrics.energyTrend >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {metrics.energyTrend >= 0 ? "+" : ""}{metrics.energyTrend}%
                  </span>
                </div>
                <p className="text-2xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}>
                  {metrics.averageEnergy.toFixed(1)}<span className="text-lg" style={{ color: "#6B7280" }}>/10</span>
                </p>
                <p className="text-xs font-medium" style={{ color: "#6B7280" }}>
                  Avg Energy · {metrics.totalCheckIns} check-ins
                </p>
              </div>

              {/* KAAL Agent Usage */}
              <div className="p-5 rounded-2xl border opacity-0"
                style={{
                  background: "rgba(168,85,247,0.08)", backdropFilter: "blur(24px)",
                  borderColor: "rgba(168,85,247,0.2)",
                  boxShadow: "0 4px 16px rgba(168,85,247,0.1)",
                  animation: "fadeInUp 0.6s ease-out 0.15s forwards",
                }}>
                <div className="flex items-center justify-between mb-3">
                  <Sparkles className="w-5 h-5" style={{ color: "#A855F7" }} />
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(168,85,247,0.15)", color: "#9333EA" }}>
                    {metrics.itemsGenerated} items
                  </span>
                </div>
                <p className="text-2xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}>
                  {metrics.brainDumpsProcessed}
                </p>
                <p className="text-xs font-medium" style={{ color: "#6B7280" }}>
                  Brain Dumps · KAAL Agent
                </p>
              </div>

              {/* Activity Score */}
              <div className="p-5 rounded-2xl border opacity-0"
                style={{
                  background: "rgba(59,130,246,0.08)", backdropFilter: "blur(24px)",
                  borderColor: "rgba(59,130,246,0.2)",
                  boxShadow: "0 4px 16px rgba(59,130,246,0.1)",
                  animation: "fadeInUp 0.6s ease-out 0.2s forwards",
                }}>
                <div className="flex items-center justify-between mb-3">
                  <TrendingUp className="w-5 h-5" style={{ color: "#3B82F6" }} />
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(59,130,246,0.15)", color: "#2563EB" }}>
                    {metrics.activeDays} active days
                  </span>
                </div>
                <p className="text-2xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}>
                  {metrics.totalActivityScore}
                </p>
                <p className="text-xs font-medium" style={{ color: "#6B7280" }}>
                  Activity Score · Peak {metrics.mostProductiveDay}
                </p>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Deep Work Ratio */}
              <div className="p-6 rounded-3xl border opacity-0"
                style={{
                  background: "rgba(255,255,255,0.55)", backdropFilter: "blur(24px) saturate(180%)",
                  WebkitBackdropFilter: "blur(24px) saturate(180%)", borderColor: "rgba(255,255,255,0.4)",
                  boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)",
                  animation: "fadeInUp 0.8s ease-out 0.1s forwards",
                }}>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <Brain className="w-6 h-6" style={{ color: "#111827" }} />
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full border ${
                    metrics.trends.deepWorkChange >= 0
                      ? "text-green-600 bg-green-50 border-green-100"
                      : "text-red-600 bg-red-50 border-red-100"}`}>
                    {metrics.trends.deepWorkChange >= 0 ? "+" : ""}{metrics.trends.deepWorkChange}%
                  </span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: "#6B7280" }}>Deep Work Ratio</h3>
                  <p className="text-4xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}>
                    {metrics.deepWorkRatio}<span className="text-xl align-top opacity-60" style={{ color: "#6B7280" }}>%</span>
                  </p>
                </div>
                <div className="mt-6 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${metrics.deepWorkRatio}%`, backgroundColor: "#111827" }} />
                </div>
                <p className="mt-3 text-xs font-medium" style={{ color: "#6B7280" }}>
                  Target: 65% · <span style={{ color: metrics.deepWorkRatio >= 65 ? "#111827" : "#EF4444" }}>
                    {metrics.deepWorkRatio >= 65 ? "Exceeded" : hasSessions ? "Below Target" : "No data"}
                  </span>
                </p>
              </div>

              {/* Cognitive Load */}
              <div className="p-6 rounded-3xl border opacity-0"
                style={{
                  background: "rgba(255,255,255,0.55)", backdropFilter: "blur(24px) saturate(180%)",
                  WebkitBackdropFilter: "blur(24px) saturate(180%)", borderColor: "rgba(255,255,255,0.4)",
                  boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)",
                  animation: "fadeInUp 0.8s ease-out 0.2s forwards",
                }}>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <PieChart className="w-6 h-6" style={{ color: "#111827" }} />
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full border ${
                    metrics.cognitiveLoad >= 7 ? "text-orange-600 bg-orange-50 border-orange-100"
                    : metrics.cognitiveLoad >= 4 ? "text-yellow-600 bg-yellow-50 border-yellow-100"
                    : "text-green-600 bg-green-50 border-green-100"}`}>
                    {metrics.cognitiveLoad >= 7 ? "High" : metrics.cognitiveLoad >= 4 ? "Medium" : hasSessions ? "Low" : "—"}
                  </span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: "#6B7280" }}>Cognitive Load</h3>
                  <p className="text-4xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}>
                    {metrics.cognitiveLoad}<span className="text-xl align-top opacity-60" style={{ color: "#6B7280" }}>/10</span>
                  </p>
                </div>
                <div className="mt-6 flex items-end gap-1 h-8">
                  {cognitiveLoadBars.map((height, i) => (
                    <div key={i} className="flex-1 rounded-t-sm"
                      style={{
                        height: `${Math.max(height, 4)}%`,
                        backgroundColor: i === 6 ? "#111827" : `rgba(17,24,39,${0.15 + (height / 100) * 0.45})`,
                      }} />
                  ))}
                </div>
                <p className="mt-3 text-xs font-medium" style={{ color: "#6B7280" }}>
                  Peak at {metrics.peakPerformanceTime} ·{" "}
                  <span className={metrics.cognitiveLoad >= 7 ? "text-orange-600" : "text-gray-600"}>
                    {metrics.cognitiveLoad >= 7 ? "Take a break" : hasSessions ? "Steady pace" : "No sessions yet"}
                  </span>
                </p>
              </div>

              {/* Focus Score */}
              <div className="p-6 rounded-3xl border opacity-0"
                style={{
                  background: "rgba(255,255,255,0.55)", backdropFilter: "blur(24px) saturate(180%)",
                  WebkitBackdropFilter: "blur(24px) saturate(180%)", borderColor: "rgba(255,255,255,0.4)",
                  boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)",
                  animation: "fadeInUp 0.8s ease-out 0.3s forwards",
                }}>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <Target className="w-6 h-6" style={{ color: "#111827" }} />
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full border ${
                    metrics.trends.focusScoreChange >= 0
                      ? "text-green-600 bg-green-50 border-green-100"
                      : "text-red-600 bg-red-50 border-red-100"}`}>
                    {metrics.trends.focusScoreChange >= 0 ? "+" : ""}{metrics.trends.focusScoreChange}%
                  </span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: "#6B7280" }}>Focus Score</h3>
                  <p className="text-4xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}>
                    {metrics.focusScore}
                  </p>
                </div>
                <div className="mt-6">
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>
                    {metrics.totalDeepWorkHours.toFixed(1)}h deep work · avg {metrics.averageSessionDuration} min/session
                  </p>
                </div>
                <p className="mt-3 text-xs font-medium" style={{ color: "#6B7280" }}>
                  {hasSessions
                    ? (metrics.trends.focusScoreChange >= 0 ? "Improving" : "Declining") + " trend"
                    : "Complete a session to score"}{" "}
                  · <span style={{ color: metrics.focusScore >= 800 ? "#111827" : "#6B7280" }}>
                    {metrics.focusScore >= 800 ? "Excellent" : metrics.focusScore > 0 ? "Good" : "—"}
                  </span>
                </p>
              </div>
            </div>

            {/* ── Real Focus Trend Chart (recharts) ── */}
            <div className="rounded-3xl p-8 border opacity-0"
              style={{
                background: "rgba(255,255,255,0.55)", backdropFilter: "blur(24px) saturate(180%)",
                WebkitBackdropFilter: "blur(24px) saturate(180%)", borderColor: "rgba(255,255,255,0.6)",
                boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)",
                animation: "fadeInUp 0.8s ease-out 0.4s forwards",
              }}>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl italic font-medium" style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}>
                    Focus Trend
                  </h3>
                  <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#111827" }} />
                      <span style={{ color: "#111827" }}>Deep Work</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-gray-300" />
                      <span style={{ color: "#6B7280" }}>Shallow</span>
                    </span>
                  </div>
                </div>
                <button className="p-2 rounded-full transition-colors" style={{ color: "#6B7280" }} onClick={handleRefreshData}>
                  <Filter className="w-5 h-5" />
                </button>
              </div>

              {hasSessions ? (
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={300}>
                    <AreaChart data={rechartsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="deepGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#111827" stopOpacity={0.12} />
                          <stop offset="95%" stopColor="#111827" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="shallowGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#D1D5DB" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#D1D5DB" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" stroke="rgba(0,0,0,0.06)" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} unit="h" />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="Shallow"   stroke="#D1D5DB" strokeDasharray="4 4" strokeWidth={2} fill="url(#shallowGrad)" />
                      <Area type="monotone" dataKey="Deep Work" stroke="#111827"  strokeWidth={3}   fill="url(#deepGrad)"
                        dot={{ r: 4, fill: "#fff", stroke: "#111827", strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: "#111827" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center gap-3" style={{ color: "#9CA3AF" }}>
                  <TrendingUp className="w-10 h-10 opacity-30" />
                  <p className="text-sm">No sessions yet — start a focus session to see your trend</p>
                  <p className="text-xs opacity-70">Data populates automatically after each completed session</p>
                </div>
              )}
            </div>

            {/* ── Bottom Row ── */}
            <div className="grid grid-cols-12 gap-6 pb-8">
              {/* Focus Quality Metrics */}
              <div className="col-span-12 lg:col-span-7 rounded-3xl p-8 opacity-0"
                style={{
                  background: "rgba(255,255,255,0.55)", backdropFilter: "blur(24px) saturate(180%)",
                  WebkitBackdropFilter: "blur(24px) saturate(180%)", borderColor: "rgba(255,255,255,0.4)",
                  boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)",
                  animation: "fadeInUp 0.8s ease-out 0.5s forwards",
                }}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg italic font-medium" style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}>
                    Focus Quality Trends
                  </h3>
                  <span className="text-xs font-bold uppercase tracking-widest border border-gray-200 rounded-full px-3 py-1" style={{ color: "#6B7280" }}>
                    This period
                  </span>
                </div>

                <div className="space-y-5">
                  {[
                    { label: "Deep Work Sessions",    count: metrics.totalSessions,    percentage: hasSessions ? Math.round((metrics.totalDeepWorkHours / (metrics.totalDeepWorkHours + metrics.totalShallowWorkHours)) * 100) : 0, color: "#111827" },
                    { label: "Avg. Session Length",   count: `${metrics.averageSessionDuration}m`, percentage: Math.min(100, Math.round(metrics.averageSessionDuration / 60 * 100)), color: "#4B5563" },
                    { label: "Focus Consistency",     count: `${hasSessions ? Math.round((chartData.filter(d => d.deepWork > 0).length / chartData.length) * 100) : 0}%`, percentage: hasSessions ? Math.round((chartData.filter(d => d.deepWork > 0).length / chartData.length) * 100) : 0, color: "#9CA3AF" },
                  ].map((item, index) => {
                    return (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium flex items-center gap-2" style={{ color: "#111827" }}>
                            <TrendingUp className="w-[18px] h-[18px]" style={{ color: "#6B7280" }} />
                            {item.label}
                          </span>
                          <span className="font-bold" style={{ color: "#111827" }}>
                            {typeof item.count === 'number' ? `${item.count} sessions` : item.count}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${item.percentage}%`, backgroundColor: item.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Sessions bar chart */}
                {hasSessions && (
                  <div className="mt-8">
                    <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#6B7280" }}>
                      Focus Minutes by Day
                    </p>
                    <div style={{ width: "100%", height: 120 }}>
                      <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={120}>
                        <BarChart data={chartData.map(d => ({ day: d.day, min: Math.round((d.deepWork + d.shallowWork) * 60) }))}>
                          <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                          <Tooltip content={<EnergyTooltip />} />
                          <Bar dataKey="min" name="Focus" fill="#111827" radius={[4, 4, 0, 0]} opacity={0.8} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              {/* Peak Performance */}
              <div className="col-span-12 lg:col-span-5 rounded-3xl p-8 flex flex-col justify-between opacity-0"
                style={{
                  background: "rgba(255,255,255,0.55)", backdropFilter: "blur(24px) saturate(180%)",
                  WebkitBackdropFilter: "blur(24px) saturate(180%)", borderColor: "rgba(255,255,255,0.4)",
                  boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)",
                  animation: "fadeInUp 0.8s ease-out 0.6s forwards",
                }}>
                <h3 className="text-lg italic font-medium mb-4" style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}>
                  Peak Performance
                </h3>

                <div className="flex items-center justify-center relative py-4">
                  <div className="relative w-48 h-48 rounded-full border border-gray-200 flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.3)", backdropFilter: "blur(4px)" }}>
                    <div className="absolute inset-0 rounded-full transform rotate-45"
                      style={{
                        borderWidth: "10px", borderStyle: "solid",
                        borderTopColor: hasSessions ? "rgba(17,24,39,0.8)" : "rgba(17,24,39,0.2)",
                        borderRightColor: hasSessions ? "rgba(17,24,39,0.4)" : "rgba(17,24,39,0.1)",
                        borderBottomColor: "#F9FAFB", borderLeftColor: "#F9FAFB",
                      }} />
                    <div className="text-center relative z-10">
                      <span className="block text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}>
                        {hasSessions ? peakLabel : "—"}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#6B7280" }}>
                        {hasSessions ? "peak time" : "no data yet"}
                      </span>
                    </div>
                  </div>

                  <div className="absolute w-56 h-56 border border-dashed border-gray-300 rounded-full"
                    style={{ animation: "spin 20s linear infinite" }}>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                      style={{ backgroundColor: "#111827" }} />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-xl" style={{ background: "rgba(0,0,0,0.03)" }}>
                    <p className="text-xs" style={{ color: "#6B7280" }}>
                      {hasSessions
                        ? `Your peak deep work hour is ${peakLabel} based on ${chartData.reduce((a,d)=>a+d.deepWork,0).toFixed(1)}h tracked this period.`
                        : "Complete focus sessions to discover your peak performance window."}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-3 rounded-xl" style={{ background: "rgba(0,0,0,0.03)" }}>
                      <p className="text-xs" style={{ color: "#9CA3AF" }}>Deep Work</p>
                      <p className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}>
                        {metrics.totalDeepWorkHours.toFixed(1)}<span className="text-xs font-normal" style={{ color: "#9CA3AF" }}>h</span>
                      </p>
                    </div>
                    <div className="p-3 rounded-xl" style={{ background: "rgba(0,0,0,0.03)" }}>
                      <p className="text-xs" style={{ color: "#9CA3AF" }}>Avg Session</p>
                      <p className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}>
                        {metrics.averageSessionDuration}<span className="text-xs font-normal" style={{ color: "#9CA3AF" }}>m</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refresh FAB */}
      <div className="fixed bottom-10 right-10 z-50">
        <button
          className="rounded-full px-5 py-3.5 shadow-lg flex items-center gap-2.5 transition-all duration-300 hover:scale-105 active:scale-95 group"
          style={{ backgroundColor: "rgba(17,24,39,0.9)", color: "white", backdropFilter: "blur(12px)", boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}
          onClick={handleRefreshData}>
          <RotateCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
          <span className="text-xs font-bold uppercase tracking-wider">Refresh</span>
        </button>
      </div>

      <style>{`
        ${SCREEN_ANIMATIONS}
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}