import { useState } from "react";
import { 
  Share2, 
  Calendar,
  ChevronDown,
  Sun,
  Moon,
  Brain,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  Plus,
  Sparkles,
  ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner@2.0.3";
import { useWeeklyInsights } from "../hooks/useWeeklyInsights";
import { copyToClipboard } from "../utils/clipboard";

export function WeeklyInsights() {
  const navigate = useNavigate();
  const { stats, taskStats, bestDay, weakestDay, dateRange } = useWeeklyInsights();

  const handleShare = () => {
    copyToClipboard("https://kaal.work/insights/weekly-report");
    toast.success("Report link copied!", {
      description: "Share this link with your team for collaborative review."
    });
  };

  const handleActionSummary = () => {
    const actions = [];
    
    if (bestDay && bestDay.hours > 0) {
      actions.push(`Your peak performance was on ${bestDay.day} (${bestDay.hours}h)`);
    }
    
    if (stats.averageHours < 4) {
      actions.push(`Increase daily deep work to 4+ hours`);
    }
    
    if (taskStats.completionRate < 70) {
      actions.push(`Focus on task completion (currently ${taskStats.completionRate}%)`);
    }
    
    const description = actions.length > 0 
      ? actions.join(' • ')
      : 'Keep up the great work! Maintain your current momentum.';
    
    toast.success("Weekly Action Summary", {
      description
    });
  };

  // Generate dynamic insights based on real data
  const insights = [
    {
      icon: Sun,
      color: "#C5A059",
      bgColor: "rgba(197, 160, 89, 0.1)",
      title: stats.daysWithWork >= 5 ? "Excellent Consistency" : "Room for Improvement",
      statusColor: "#C5A059",
      content: (
        <>
          You completed deep work on <span className="font-bold">{stats.daysWithWork} of 7 days</span> this week.
          {stats.daysWithWork >= 5 ? ' Excellent consistency!' : ' Try to maintain daily focus sessions.'}
        </>
      ),
      actionIcon: stats.daysWithWork >= 5 ? CheckCircle : AlertTriangle
    },
    {
      icon: Moon,
      color: "#5B21B6",
      bgColor: "rgba(91, 33, 182, 0.1)",
      title: taskStats.completionRate >= 70 ? "Positive Trend" : "Needs Attention",
      statusColor: "#5B21B6",
      content: (
        <>
          Task completion rate: <span className="font-bold">{taskStats.completionRate}%</span> 
          {taskStats.total > 0 ? ` (${taskStats.completed}/${taskStats.total} completed)` : ' (no tasks this week)'}
          {taskStats.completionRate >= 70 ? '. Great progress!' : '. Focus on finishing started tasks.'}
        </>
      ),
      actionIcon: taskStats.completionRate >= 70 ? TrendingUp : AlertTriangle
    },
    {
      icon: Brain,
      color: "#111827",
      bgColor: "rgba(17, 24, 39, 0.1)",
      title: bestDay && bestDay.hours > 0 ? "Peak Performance Detected" : "Build Momentum",
      statusColor: "#111827",
      content: (
        <>
          {bestDay && bestDay.hours > 0 ? (
            <>
              Your best day was <span className="font-bold">{bestDay.day}</span> with{' '}
              <span className="font-bold">{bestDay.hours}h</span> of deep work.
              {weakestDay && weakestDay.hours > 0 && weakestDay.hours < bestDay.hours && (
                <> Consider what worked well and apply it to {weakestDay.day}.</>
              )}
            </>
          ) : (
            <>
              No deep work sessions recorded this week. Start building your focus habit with daily sessions.
            </>
          )}
        </>
      ),
      actionIcon: bestDay && bestDay.hours > 0 ? CheckCircle : AlertTriangle
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ backgroundColor: "#F8F9FA" }}>
      {/* Header */}
      <header 
        className="h-24 border-b flex items-center justify-between px-12 z-20"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.4)",
          backdropFilter: "blur(12px)",
          borderColor: "rgba(255, 255, 255, 0.4)"
        }}
      >
        <div className="flex items-center gap-4">
          {/* Back Button */}
          <button
            onClick={() => navigate("/energy")}
            className="w-10 h-10 rounded-full flex items-center justify-center border transition-all hover:scale-105 group"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.6)",
              borderColor: "rgba(255, 255, 255, 0.8)",
              color: "#6B7280"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#111827";
              e.currentTarget.style.borderColor = "#111827";
              e.currentTarget.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.6)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.8)";
              e.currentTarget.style.color = "#6B7280";
            }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <h1 
            className="text-3xl font-medium tracking-tight"
            style={{ 
              fontFamily: "'Playfair Display', serif",
              color: "#111827",
              animation: "settle 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards"
            }}
          >
            Weekly Performance Synthesis
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div 
            className="flex items-center gap-3 px-4 py-2 rounded-full border shadow-sm text-sm"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.6)",
              borderColor: "rgba(255, 255, 255, 0.8)"
            }}
          >
            <Calendar className="w-4 h-4" style={{ color: "#6B7280" }} />
            <span className="font-medium" style={{ color: "#6B7280" }}>{dateRange}</span>
            <ChevronDown className="w-4 h-4 cursor-pointer" style={{ color: "#6B7280" }} />
          </div>
          
          <button 
            className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform"
            style={{ backgroundColor: "#111827" }}
            onClick={handleShare}
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div 
        className="flex-1 overflow-y-auto p-12"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(17, 24, 39, 0.2) transparent"
        }}
      >
        <div className="max-w-7xl mx-auto space-y-10">
          {/* Focus Equilibrium & Energy Chart */}
          <section className="grid grid-cols-12 gap-8">
            {/* Focus Equilibrium */}
            <div 
              className="col-span-12 lg:col-span-5 rounded-[2.5rem] p-10 flex flex-col items-center justify-center"
              style={{
                background: "rgba(255, 255, 255, 0.5)",
                backdropFilter: "blur(24px)",
                border: "1px solid rgba(255, 255, 255, 0.6)",
                boxShadow: "0 10px 40px -10px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.5)",
                animation: "fadeInUp 0.8s ease-out 0.1s forwards",
                opacity: 0
              }}
            >
              <h3 
                className="text-sm font-bold uppercase tracking-[0.2em] mb-8"
                style={{ color: "#6B7280" }}
              >
                Focus Equilibrium
              </h3>
              
              <div className="relative w-64 h-64">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 256 256">
                  {/* Background circles */}
                  <circle cx="128" cy="128" r="110" fill="none" stroke="rgba(0,0,0,0.03)" strokeWidth="12" />
                  {/* Gold circle (Consistency) - dynamically calculated */}
                  <circle 
                    cx="128" 
                    cy="128" 
                    r="110" 
                    fill="none" 
                    stroke="url(#goldGradient)" 
                    strokeWidth="12"
                    strokeDasharray="691"
                    strokeDashoffset={691 - (691 * stats.consistency / 100)}
                    strokeLinecap="round"
                    className="opacity-80"
                    style={{ transition: "stroke-dashoffset 1s ease-out" }}
                  />
                  
                  {/* Inner background */}
                  <circle cx="128" cy="128" r="90" fill="none" stroke="rgba(0,0,0,0.03)" strokeWidth="8" />
                  {/* Violet circle (Intensity) - dynamically calculated */}
                  <circle 
                    cx="128" 
                    cy="128" 
                    r="90" 
                    fill="none" 
                    stroke="url(#violetGradient)" 
                    strokeWidth="8"
                    strokeDasharray="565"
                    strokeDashoffset={565 - (565 * stats.intensity / 100)}
                    strokeLinecap="round"
                    className="opacity-80"
                    style={{ transition: "stroke-dashoffset 1s ease-out" }}
                  />
                  
                  {/* Animated dot */}
                  <circle 
                    cx="238" 
                    cy="128" 
                    r="6" 
                    fill="#111827"
                    style={{
                      animation: "liquidGlow 3s ease-in-out infinite"
                    }}
                  />
                  
                  <defs>
                    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#C5A059" />
                      <stop offset="100%" stopColor="#E5C179" />
                    </linearGradient>
                    <linearGradient id="violetGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#5B21B6" />
                      <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>
                  </defs>
                </svg>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span 
                    className="text-6xl font-bold"
                    style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
                  >
                    {stats.focusEquilibrium}
                  </span>
                  <span 
                    className="text-xs font-bold tracking-widest mt-1"
                    style={{ color: "rgba(107, 114, 128, 0.6)" }}
                  >
                    {stats.focusEquilibrium >= 80 ? 'OPTIMAL' : stats.focusEquilibrium >= 60 ? 'GOOD' : stats.focusEquilibrium >= 40 ? 'FAIR' : 'BUILDING'}
                  </span>
                </div>
              </div>
              
              <div className="mt-8 flex gap-8">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#C5A059" }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#6B7280" }}>
                    Consistency
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#5B21B6" }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#6B7280" }}>
                    Intensity
                  </span>
                </div>
              </div>
            </div>

            {/* Energy vs Output Chart */}
            <div 
              className="col-span-12 lg:col-span-7 rounded-[2.5rem] p-10"
              style={{
                background: "rgba(255, 255, 255, 0.5)",
                backdropFilter: "blur(24px)",
                border: "1px solid rgba(255, 255, 255, 0.6)",
                boxShadow: "0 10px 40px -10px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.5)",
                animation: "fadeInUp 0.8s ease-out 0.2s forwards",
                opacity: 0
              }}
            >
              <div className="flex justify-between items-center mb-10">
                <h3 
                  className="text-xl font-medium italic"
                  style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
                >
                  Energy vs. Output
                </h3>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-0.5" style={{ backgroundColor: "#C5A059" }} />
                    <span className="text-xs font-medium" style={{ color: "#6B7280" }}>Energy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-0.5" style={{ backgroundColor: "#5B21B6" }} />
                    <span className="text-xs font-medium" style={{ color: "#6B7280" }}>Productivity</span>
                  </div>
                </div>
              </div>
              
              <div className="h-64 w-full relative">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* Energy line */}
                  <path 
                    d="M0,60 C10,55 20,75 30,50 C40,25 50,45 60,35 C70,25 80,40 90,15 C95,5 100,10 100,10"
                    fill="none"
                    stroke="rgba(197, 160, 89, 0.4)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  {/* Productivity line */}
                  <path 
                    d="M0,80 C15,75 25,60 35,65 C45,70 55,40 65,45 C75,50 85,25 100,30"
                    fill="none"
                    stroke="rgba(91, 33, 182, 0.4)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  {/* Animated dots */}
                  <circle cx="90" cy="15" r="2.5" fill="#C5A059" className="animate-pulse" />
                  <circle cx="100" cy="30" r="2.5" fill="#5B21B6" className="animate-pulse" />
                </svg>
                
                <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] font-bold pt-4 uppercase tracking-widest" style={{ color: "rgba(107, 114, 128, 0.4)" }}>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>
              </div>
            </div>
          </section>

          {/* Daily Deep Work Breakdown */}
          <section 
            style={{
              animation: "fadeInUp 0.8s ease-out 0.3s forwards",
              opacity: 0
            }}
          >
            <div className="flex items-center justify-between mb-6 px-2">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em]" style={{ color: "#6B7280" }}>
                Daily Deep Work Breakdown
              </h3>
              <span 
                className="text-xs font-medium px-3 py-1 rounded-full border"
                style={{
                  color: "#111827",
                  backgroundColor: "rgba(255, 255, 255, 0.6)",
                  borderColor: "white"
                }}
              >
                Average: {stats.averageHours}h
              </span>
            </div>
            
            <div className="grid grid-cols-7 gap-4">
              {stats.dailyData.map((data, index) => (
                <div
                  key={index}
                  className="rounded-2xl p-5 flex flex-col items-center gap-4 group hover:-translate-y-1 transition-transform cursor-pointer"
                  style={{
                    background: data.isHighlight ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.5)",
                    backdropFilter: "blur(24px)",
                    border: "1px solid rgba(255, 255, 255, 0.6)",
                    boxShadow: "0 10px 40px -10px rgba(0,0,0,0.04)"
                  }}
                >
                  <span className="text-[10px] font-bold uppercase" style={{ color: "#6B7280" }}>
                    {data.day}
                  </span>
                  <div className="w-1.5 h-24 bg-black/5 rounded-full relative overflow-hidden">
                    <div 
                      className="absolute bottom-0 left-0 right-0 rounded-full transition-all duration-1000"
                      style={{ 
                        backgroundColor: "#111827",
                        height: `${data.percentage}%`
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold" style={{ color: "#111827" }}>
                    {data.hours}h
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Cognitive Intelligence */}
          <section 
            style={{
              animation: "fadeInUp 0.8s ease-out 0.4s forwards",
              opacity: 0
            }}
          >
            <div className="flex items-center gap-3 mb-6 px-2">
              <Sparkles className="w-5 h-5" style={{ color: "#5B21B6" }} />
              <h3 className="text-sm font-bold uppercase tracking-[0.2em]" style={{ color: "#6B7280" }}>
                Cognitive Intelligence
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {insights.map((insight, index) => {
                const Icon = insight.icon;
                const ActionIcon = insight.actionIcon;
                
                return (
                  <div
                    key={index}
                    className="rounded-3xl p-8 group hover:bg-white/70 transition-colors"
                    style={{
                      background: "rgba(255, 255, 255, 0.5)",
                      backdropFilter: "blur(24px)",
                      border: "1px solid rgba(255, 255, 255, 0.6)",
                      boxShadow: "0 10px 40px -10px rgba(0,0,0,0.04)"
                    }}
                  >
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-6"
                      style={{
                        backgroundColor: insight.bgColor,
                        color: insight.color
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    
                    <p className="leading-relaxed font-light" style={{ color: "#111827" }}>
                      {insight.content}
                    </p>
                    
                    <div 
                      className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: insight.statusColor }}
                    >
                      <span>{insight.title}</span>
                      <ActionIcon className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
        
        <div className="h-20" />
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-10 right-10 z-50">
        <button 
          className="text-white rounded-full px-10 py-5 shadow-2xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all group relative overflow-hidden border"
          style={{
            backgroundColor: "rgba(17, 24, 39, 0.9)",
            backdropFilter: "blur(12px)",
            borderColor: "rgba(255, 255, 255, 0.2)"
          }}
          onClick={handleActionSummary}
          onMouseEnter={(e) => {
            const overlay = e.currentTarget.querySelector('.hover-overlay') as HTMLElement;
            if (overlay) overlay.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            const overlay = e.currentTarget.querySelector('.hover-overlay') as HTMLElement;
            if (overlay) overlay.style.opacity = '0';
          }}
        >
          <div 
            className="hover-overlay absolute inset-0 bg-white/10 opacity-0 transition-opacity pointer-events-none"
          />
          <Plus className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          <span className="font-bold tracking-widest text-xs uppercase">Action Summary</span>
        </button>
      </div>
    </div>
  );
}