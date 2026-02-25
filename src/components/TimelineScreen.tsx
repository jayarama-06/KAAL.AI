import { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  History,
  TrendingUp,
  Minus,
  FileText,
  Brain,
  CheckCircle2,
  Trash2,
  PlusCircle,
  Clock
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { getTimelineEvents, TimelineEvent } from "../services/timeline-service";

interface TimelineEntry {
  id: string;
  day: string;
  date: string;
  score: number;
  tasks: number;
  deepWork: string;
  type: "full" | "medium" | "minimal";
  milestone?: {
    title: string;
    description: string;
    time: string;
    tag: string;
  };
  description?: string;
  opacity: number;
  dotSize: "large" | "medium" | "small";
}

export function TimelineScreen() {
  const { user } = useAuth();
  const [currentMonth] = useState("February 2026");
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  
  // Load timeline events
  useEffect(() => {
    if (user) {
      const events = getTimelineEvents(user.id);
      setTimelineEvents(events);
    }
  }, [user]);
  
  const timelineEntries: TimelineEntry[] = [
    {
      id: "1",
      day: "Mon",
      date: "Oct 23",
      score: 92,
      tasks: 8,
      deepWork: "6.5h",
      type: "full",
      milestone: {
        title: "Q4 Strategy finalized",
        description: "Approved the final budget allocation for the marketing campaign and locked in key deliverables for November.",
        time: "14:30 PM",
        tag: "Major Milestone"
      },
      opacity: 1,
      dotSize: "large"
    },
    {
      id: "2",
      day: "Fri",
      date: "Oct 20",
      score: 68,
      tasks: 4,
      deepWork: "3.2h",
      type: "medium",
      description: "Spent majority of the day updating internal wiki and API references.",
      opacity: 0.8,
      dotSize: "medium"
    },
    {
      id: "3",
      day: "Thu",
      date: "Oct 19",
      score: 85,
      tasks: 0,
      deepWork: "0h",
      type: "minimal",
      description: "Regular maintenance and server patching.",
      opacity: 0.6,
      dotSize: "small"
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-10 scroll-smooth">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Title + Month Navigation */}
        <div className="flex justify-between items-end">
          <div>
            <h2 
              className="text-5xl font-medium tracking-tight leading-tight"
              style={{
                fontFamily: "'Playfair Display', serif",
                color: "#111827",
                animation: "settle 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards"
              }}
            >
              Activity <span className="italic" style={{ color: "rgba(107, 114, 128, 0.5)" }}>Timeline.</span>
            </h2>
            <p 
              className="mt-3 text-lg font-light tracking-wide max-w-lg opacity-0"
              style={{ 
                color: "#6B7280",
                animation: "fadeInUp 0.8s ease-out 0.2s forwards"
              }}
            >
              Track all your task activities and milestones.
            </p>
          </div>

          {/* Month Navigation */}
          <div 
            className="flex gap-3 items-center p-2 rounded-2xl border shadow-sm"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.3)",
              borderColor: "rgba(255, 255, 255, 0.4)",
              backdropFilter: "blur(4px)"
            }}
          >
            <button 
              className="w-10 h-10 flex items-center justify-center rounded-xl transition-all"
              style={{ color: "#6B7280" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "white";
                e.currentTarget.style.color = "#111827";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#6B7280";
              }}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div 
              className="px-4 font-medium text-lg min-w-[140px] text-center"
              style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
            >
              {currentMonth}
            </div>
            
            <button 
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-sm transition-all"
              style={{ color: "#111827" }}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Timeline Events - Recent Activity */}
        {timelineEvents.length > 0 && (
          <div 
            className="rounded-3xl p-8 border relative overflow-hidden opacity-0"
            style={{
              background: "rgba(255, 255, 255, 0.55)",
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
              borderColor: "rgba(255, 255, 255, 0.6)",
              boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)",
              animation: "fadeInUp 0.8s ease-out 0.5s forwards"
            }}
          >
            {/* Blur Orbs */}
            <div 
              className="absolute -top-20 -right-20 w-80 h-80 rounded-full pointer-events-none"
              style={{ 
                backgroundColor: "#DBEAFE",
                filter: "blur(80px)",
                opacity: 0.3
              }}
            />
            
            <div className="relative z-10">
              <h3 
                className="text-2xl italic font-medium flex items-center gap-3 mb-6"
                style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
              >
                <History className="w-7 h-7" style={{ color: "#6B7280" }} />
                Recent Activity
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {timelineEvents.slice(0, 9).map((event) => (
                  <TimelineEventCard key={event.id} event={event} />
                ))}
              </div>

              {timelineEvents.length > 9 && (
                <button 
                  className="mt-5 w-full py-2.5 rounded-xl border transition-all text-sm font-medium"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.4)",
                    borderColor: "rgba(255, 255, 255, 0.6)",
                    color: "#6B7280"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.7)";
                    e.currentTarget.style.color = "#111827";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.4)";
                    e.currentTarget.style.color = "#6B7280";
                  }}
                >
                  View All {timelineEvents.length} Events
                </button>
              )}
            </div>
          </div>
        )}

        {/* Timeline Panel */}
        <div 
          className="rounded-3xl p-10 border relative overflow-hidden opacity-0"
          style={{
            background: "rgba(255, 255, 255, 0.55)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            borderColor: "rgba(255, 255, 255, 0.6)",
            boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)",
            animation: "fadeInUp 0.8s ease-out 0.7s forwards"
          }}
        >
          {/* Blur Orbs */}
          <div 
            className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
            style={{ 
              backgroundColor: "#EFF6FF",
              filter: "blur(80px)",
              opacity: 0.4
            }}
          />
          <div 
            className="absolute bottom-0 left-0 w-96 h-96 rounded-full pointer-events-none"
            style={{ 
              backgroundColor: "#F3F4F6",
              filter: "blur(100px)",
              opacity: 0.4
            }}
          />

          {/* Header */}
          <div className="flex items-center justify-between mb-12 relative z-10">
            <h3 
              className="text-xl italic font-medium flex items-center gap-2"
              style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
            >
              <History className="w-6 h-6" style={{ color: "#6B7280" }} />
              History Log
            </h3>

            <div className="flex gap-4 text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(107, 114, 128, 0.6)" }}>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                High Productivity
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                Moderate
              </span>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative pl-8 pr-4 pb-4 max-h-[800px] overflow-y-auto scroll-smooth" style={{ scrollbarWidth: "thin", scrollbarColor: "#D1D5DB #F3F4F6" }}>
            {/* Vertical Line */}
            <div 
              className="absolute top-4 bottom-10 w-[2px] z-0"
              style={{
                left: "139px",
                background: "linear-gradient(to bottom, rgba(209, 213, 219, 0.1), rgba(209, 213, 219, 0.8) 10%, rgba(209, 213, 219, 0.8) 90%, rgba(209, 213, 219, 0.1))"
              }}
            />

            {/* Timeline Entries */}
            <div className="space-y-14">
              {timelineEntries.map((entry) => (
                <TimelineItem key={entry.id} entry={entry} />
              ))}
            </div>
          </div>
        </div>

        <div className="h-24"></div>
      </div>
    </div>
  );
}

interface TimelineEventCardProps {
  event: TimelineEvent;
}

function TimelineEventCard({ event }: TimelineEventCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'task_created':
        return <PlusCircle className="w-3.5 h-3.5" />;
      case 'task_completed':
        return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'task_deleted':
        return <Trash2 className="w-3.5 h-3.5" />;
      case 'milestone':
        return <Brain className="w-3.5 h-3.5" />;
      default:
        return <FileText className="w-3.5 h-3.5" />;
    }
  };

  const getEventColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'task_created':
        return { bg: '#EFF6FF', text: '#3B82F6', border: 'rgba(59, 130, 246, 0.2)' };
      case 'task_completed':
        return { bg: '#D1FAE5', text: '#10B981', border: 'rgba(16, 185, 129, 0.2)' };
      case 'task_deleted':
        return { bg: '#FEF2F2', text: '#DC2626', border: 'rgba(239, 68, 68, 0.2)' };
      case 'milestone':
        return { bg: '#F3E8FF', text: '#8B5CF6', border: 'rgba(139, 92, 246, 0.2)' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280', border: 'rgba(107, 114, 128, 0.2)' };
    }
  };

  const color = getEventColor(event.type);

  return (
    <div
      className="group p-3.5 rounded-xl border transition-all duration-300 cursor-pointer relative"
      style={{
        backgroundColor: isHovered ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.5)",
        borderColor: isHovered ? color.border : "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(8px)",
        boxShadow: isHovered ? "0 6px 12px -2px rgba(0,0,0,0.08)" : "0 1px 2px 0 rgba(0,0,0,0.04)",
        transform: isHovered ? "translateY(-1px)" : "translateY(0)"
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Refraction Border Effect */}
      <div 
        className="absolute inset-0 rounded-xl opacity-80 pointer-events-none"
        style={{
          padding: "1px",
          background: "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.1) 40%, rgba(255,255,255,0.05) 60%, rgba(255,255,255,0.6))",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude"
        }}
      />

      <div className="flex items-start gap-2.5 relative z-10">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-300"
          style={{ 
            backgroundColor: color.bg, 
            color: color.text,
            transform: isHovered ? "scale(1.05)" : "scale(1)"
          }}
        >
          {getEventIcon(event.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-xs truncate leading-tight mb-0.5" style={{ color: "#111827" }}>
            {event.title}
          </h4>
          {event.description && (
            <p className="text-[11px] line-clamp-1 mb-1.5" style={{ color: "#6B7280", lineHeight: "1.4" }}>
              {event.description}
            </p>
          )}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-medium" style={{ color: "#9CA3AF" }}>
              {event.day}, {event.date}
            </span>
            {event.metadata?.priority && (
              <span 
                className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: event.metadata.priority === 'urgent' ? '#FEE2E2' :
                                   event.metadata.priority === 'high' ? '#FED7AA' :
                                   event.metadata.priority === 'medium' ? '#DBEAFE' :
                                   '#F3F4F6',
                  color: event.metadata.priority === 'urgent' ? '#DC2626' :
                         event.metadata.priority === 'high' ? '#EA580C' :
                         event.metadata.priority === 'medium' ? '#2563EB' :
                         '#6B7280'
                }}
              >
                {event.metadata.priority}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface TimelineItemProps {
  entry: TimelineEntry;
}

function TimelineItem({ entry }: TimelineItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: "#10B981", light: "#D1FAE5", text: "#059669" };
    return { bg: "#F59E0B", light: "#FED7AA", text: "#D97706" };
  };

  const scoreColor = getScoreColor(entry.score);
  const isDayMuted = entry.day === "Fri" || entry.day === "Thu";

  return (
    <div 
      className="flex group relative z-10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ opacity: entry.opacity }}
    >
      {/* Date Column */}
      <div className="w-[120px] pr-10 text-right pt-2 flex flex-col items-end">
        <span 
          className="block text-2xl font-medium"
          style={{ 
            fontFamily: "'Playfair Display', serif",
            color: isDayMuted ? "rgba(107, 114, 128, 0.7)" : "#111827"
          }}
        >
          {entry.day}
        </span>
        <span 
          className="block text-xs font-bold tracking-widest uppercase mt-0.5"
          style={{ color: isDayMuted ? "rgba(107, 114, 128, 0.5)" : "#6B7280" }}
        >
          {entry.date}
        </span>
      </div>

      {/* Content */}
      <div className="relative flex-1">
        {/* Timeline Dot */}
        <div 
          className="absolute top-3 z-20 rounded-full border transition-transform duration-300"
          style={{
            left: entry.dotSize === "large" ? "-9px" : "-7px",
            width: entry.dotSize === "large" ? "20px" : "16px",
            height: entry.dotSize === "large" ? "20px" : "16px",
            backgroundColor: entry.dotSize === "large" ? "white" : "#E5E7EB",
            borderWidth: entry.dotSize === "large" ? "4px" : "2px",
            borderColor: entry.dotSize === "large" ? "#F3F4F6" : "white",
            boxShadow: entry.dotSize === "large" ? "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" : "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
            transform: isHovered ? "scale(1.1)" : "scale(1)"
          }}
        />

        {/* Content Cards */}
        <div 
          className="ml-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-start transition-opacity"
          style={{ 
            opacity: isHovered ? 1 : (entry.type === "full" ? 1 : entry.opacity)
          }}
        >
          {/* Full Type */}
          {entry.type === "full" && (
            <>
              <ProductivityCard 
                score={entry.score}
                tasks={entry.tasks}
                deepWork={entry.deepWork}
                scoreColor={scoreColor}
              />
              {entry.milestone && (
                <MilestoneCard milestone={entry.milestone} isHovered={isHovered} />
              )}
            </>
          )}

          {/* Medium Type */}
          {entry.type === "medium" && (
            <>
              <ProductivityCard 
                score={entry.score}
                tasks={entry.tasks}
                deepWork={entry.deepWork}
                scoreColor={scoreColor}
                muted
              />
              <SimpleEventCard 
                title="Documentation Day"
                description={entry.description || ""}
              />
            </>
          )}

          {/* Minimal Type */}
          {entry.type === "minimal" && (
            <div className="col-span-12 p-5 rounded-2xl border flex items-center justify-between" style={{ backgroundColor: "transparent", borderColor: "rgba(229, 231, 235, 0.5)" }}>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-serif" style={{ color: "#111827" }}>{entry.score}%</span>
                <div className="h-8 w-px bg-gray-300"></div>
                <p className="text-sm" style={{ color: "#6B7280" }}>{entry.description}</p>
              </div>
              <button className="text-xs font-bold uppercase tracking-wider hover:text-gray-900 transition-colors" style={{ color: "#6B7280" }}>
                Expand Details
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ProductivityCardProps {
  score: number;
  tasks: number;
  deepWork: string;
  scoreColor: { bg: string; light: string; text: string };
  muted?: boolean;
}

function ProductivityCard({ score, tasks, deepWork, scoreColor, muted }: ProductivityCardProps) {
  return (
    <div 
      className="col-span-12 md:col-span-4 p-6 rounded-2xl border shadow-sm flex flex-col justify-between h-full transition-all duration-300"
      style={{
        backgroundColor: muted ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 255, 255, 0.6)",
        borderColor: muted ? "rgba(255, 255, 255, 0.6)" : "white",
        backdropFilter: "blur(4px)"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
      }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6B7280" }}>
            Productivity Score
          </span>
          <span 
            className="text-3xl font-bold mt-1"
            style={{ 
              fontFamily: "'Playfair Display', serif",
              color: muted ? "#6B7280" : "#111827"
            }}
          >
            {score}%
          </span>
        </div>
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center border"
          style={{ 
            backgroundColor: scoreColor.light,
            color: scoreColor.text,
            borderColor: scoreColor.text + "33"
          }}
        >
          {score >= 80 ? <TrendingUp className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-1">
        <div 
          className="h-1 rounded-full transition-all duration-500"
          style={{ 
            width: `${score}%`,
            backgroundColor: scoreColor.bg
          }}
        ></div>
      </div>

      <div className="mt-3 flex gap-4 text-xs font-medium" style={{ color: "#6B7280" }}>
        <span>{tasks} Tasks Done</span>
        <span>•</span>
        <span>{deepWork} Deep Work</span>
      </div>
    </div>
  );
}

interface MilestoneCardProps {
  milestone: {
    title: string;
    description: string;
    time: string;
    tag: string;
  };
  isHovered: boolean;
}

function MilestoneCard({ milestone, isHovered }: MilestoneCardProps) {
  return (
    <div 
      className="col-span-12 md:col-span-8 p-0.5 rounded-2xl relative overflow-hidden transition-transform duration-500"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,255,255,0.2), transparent)",
        boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
        transform: isHovered ? "translateY(-4px)" : "translateY(0)"
      }}
    >
      {/* Shimmer Effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(120deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 70%)",
          opacity: isHovered ? 1 : 0,
          animation: isHovered ? "shimmer 3s infinite" : "none"
        }}
      />

      <div 
        className="p-6 rounded-[14px] h-full flex flex-col justify-center relative overflow-hidden"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.4)",
          backdropFilter: "blur(12px)"
        }}
      >
        {/* Purple Blur */}
        <div 
          className="absolute -right-10 -top-10 w-40 h-40 rounded-full mix-blend-multiply"
          style={{ 
            backgroundColor: "#DDD6FE",
            filter: "blur(48px)",
            opacity: 0.3
          }}
        />

        <div className="flex justify-between items-start mb-2 relative z-10">
          <span 
            className="px-2 py-1 rounded text-[10px] font-bold border uppercase tracking-wider"
            style={{
              backgroundColor: "#FAF5FF",
              color: "#7C3AED",
              borderColor: "#E9D5FF"
            }}
          >
            {milestone.tag}
          </span>
          <span 
            className="text-xs italic"
            style={{ 
              color: "#6B7280",
              fontFamily: "'Playfair Display', serif"
            }}
          >
            {milestone.time}
          </span>
        </div>

        <h4 className="font-bold text-lg mb-1 relative z-10" style={{ color: "#111827" }}>
          {milestone.title}
        </h4>
        <p 
          className="text-sm relative z-10 line-clamp-2"
          style={{ color: "#6B7280" }}
        >
          {milestone.description}
        </p>
      </div>
    </div>
  );
}

interface SimpleEventCardProps {
  title: string;
  description: string;
}

function SimpleEventCard({ title, description }: SimpleEventCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="col-span-12 md:col-span-8 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer relative"
      style={{
        background: "rgba(255, 255, 255, 0.55)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        border: "1px solid rgba(255, 255, 255, 0.4)",
        boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.05)"
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Refraction Border Effect */}
      <div 
        className="absolute inset-0 rounded-2xl opacity-80 pointer-events-none"
        style={{
          padding: "1px",
          background: "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.1) 40%, rgba(255,255,255,0.05) 60%, rgba(255,255,255,0.6))",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude"
        }}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div 
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "#EFF6FF", color: "#2563EB" }}
          >
            <FileText className="w-4 h-4" />
          </div>
          <h4 
            className="font-semibold text-lg group-hover:text-blue-900 transition-colors"
            style={{ 
              fontFamily: "'Playfair Display', serif",
              color: "#111827" 
            }}
          >
            {title}
          </h4>
        </div>

        <p 
          className="text-sm font-light ml-12"
          style={{ color: "#6B7280" }}
        >
          {description}
        </p>
      </div>
    </div>
  );
}