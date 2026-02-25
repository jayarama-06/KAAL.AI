import { useState } from "react";
import { 
  X, 
  Clock, 
  Edit,
  Zap,
  MoreHorizontal
} from "lucide-react";

interface FocusSessionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onStartSession?: () => void;
  onDeleteEvent?: () => void;
  sessionData?: SessionData;
  eventId?: string;
}

export interface SessionData {
  title: string;
  startTime: string;
  endTime: string;
  duration: number;
  type: "focus" | "meeting" | "break";
  participant?: {
    name: string;
    initials: string;
    type: "solo" | "group";
  };
  intentions?: string;
}

interface PrepTask {
  id: string;
  text: string;
  completed: boolean;
}

export function FocusSessionPanel({ 
  isOpen, 
  onClose, 
  onStartSession,
  onDeleteEvent,
  sessionData = {
    title: "Deep Work Context",
    startTime: "10:00 AM",
    endTime: "11:30 AM",
    duration: 90,
    type: "focus",
    participant: {
      name: "Solo Focus",
      initials: "JS",
      type: "solo"
    },
    intentions: "Goal: Finalize the primary component library for the mobile dashboard. Focus on accessibility contrast ratios."
  }
}: FocusSessionPanelProps) {
  const [prepTasks, setPrepTasks] = useState<PrepTask[]>([
    { id: "1", text: "Silence all Slack notifications", completed: false },
    { id: "2", text: "Review previous session notes", completed: true },
    { id: "3", text: "Open Figma design tokens file", completed: false },
  ]);

  if (!isOpen) return null;

  const toggleTask = (taskId: string) => {
    setPrepTasks(prepTasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.05)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)"
        }}
        onClick={onClose}
      />

      {/* Side Panel */}
      <div 
        className="fixed top-0 right-0 h-full w-full max-w-md z-50"
        style={{
          animation: "slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        <div 
          className="h-full flex flex-col relative overflow-hidden shadow-2xl"
          style={{
            background: "rgba(255, 255, 255, 0.6)",
            backdropFilter: "blur(32px)",
            WebkitBackdropFilter: "blur(32px)",
            border: "1px solid rgba(255, 255, 255, 0.6)",
            boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)"
          }}
        >
          {/* Top Gradient Bar */}
          <div 
            className="absolute top-0 left-0 w-full h-1.5 opacity-80"
            style={{
              background: "linear-gradient(to right, #60A5FA, #6366F1, #A855F7)"
            }}
          />

          {/* Header */}
          <div className="px-8 pt-12 pb-6 shrink-0">
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col gap-1">
                <span 
                  className="inline-flex w-fit px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                  style={{
                    backgroundColor: "#EEF2FF",
                    color: "#4338CA",
                    borderColor: "#C7D2FE"
                  }}
                >
                  Focus Block
                </span>
                <h2 
                  className="text-3xl font-bold tracking-tight"
                  style={{ 
                    fontFamily: "'Playfair Display', serif",
                    color: "#111827"
                  }}
                >
                  {sessionData.title}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/50 transition-colors"
                style={{ color: "#6B7280" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#111827"}
                onMouseLeave={(e) => e.currentTarget.style.color = "#6B7280"}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div 
              className="flex items-center gap-3 text-sm font-medium"
              style={{ color: "#6B7280" }}
            >
              <Clock className="w-4.5 h-4.5" />
              <span>{sessionData.startTime} — {sessionData.endTime}</span>
              <span 
                className="w-1 h-1 rounded-full"
                style={{ backgroundColor: "#D1D5DB" }}
              />
              <span>{sessionData.duration} min</span>
            </div>
          </div>

          {/* Scrollable Content */}
          <div 
            className="flex-1 overflow-y-auto px-8 space-y-8 pb-10"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {/* Daily Flow Context */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 
                  className="text-xs font-bold uppercase tracking-[0.1em]"
                  style={{ color: "#6B7280" }}
                >
                  Daily Flow Context
                </h3>
                <span 
                  className="text-[10px] font-bold px-2 py-0.5 rounded border"
                  style={{
                    color: "#059669",
                    backgroundColor: "#ECFDF5",
                    borderColor: "#A7F3D0"
                  }}
                >
                  High Recovery Zone
                </span>
              </div>

              <div 
                className="border rounded-2xl p-5 space-y-6"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.4)",
                  borderColor: "rgba(255, 255, 255, 0.8)"
                }}
              >
                <div className="space-y-3">
                  <div 
                    className="flex justify-between text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: "#6B7280" }}
                  >
                    <span>Morning Routine</span>
                    <span style={{ color: "#111827" }}>This Session</span>
                    <span>Deep Work 2</span>
                  </div>

                  <div 
                    className="h-4 rounded-full flex overflow-hidden p-0.5 ring-1"
                    style={{
                      backgroundColor: "rgba(243, 244, 246, 0.5)",
                      ringColor: "rgba(0, 0, 0, 0.05)"
                    }}
                  >
                    <div 
                      className="h-full rounded-l-full"
                      style={{ 
                        backgroundColor: "#C7D2FE",
                        width: "20%"
                      }}
                    />
                    <div className="h-full bg-transparent w-[2%]" />
                    <div 
                      className="h-full rounded-md shadow-lg"
                      style={{ 
                        backgroundColor: "#4F46E5",
                        width: "45%",
                        boxShadow: "0 10px 15px -3px rgba(99, 102, 241, 0.3)"
                      }}
                    />
                    <div className="h-full bg-transparent w-[3%]" />
                    <div 
                      className="h-full rounded-r-full"
                      style={{ 
                        backgroundColor: "#A5B4FC",
                        width: "30%"
                      }}
                    />
                  </div>

                  <p 
                    className="text-[11px] leading-relaxed italic"
                    style={{ color: "#6B7280" }}
                  >
                    This 90-minute block is situated in your peak cognitive window. Avoid meetings immediately following to preserve momentum.
                  </p>
                </div>
              </div>
            </section>

            {/* Session Focus */}
            <section className="space-y-3">
              <h3 
                className="text-xs font-bold uppercase tracking-[0.1em]"
                style={{ color: "#6B7280" }}
              >
                Session Focus
              </h3>
              <div 
                className="flex items-center gap-3 p-3 border rounded-xl"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.4)",
                  borderColor: "rgba(255, 255, 255, 0.6)"
                }}
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ring-2 shadow-sm"
                  style={{
                    backgroundColor: "#111827",
                    color: "white",
                    ringColor: "white"
                  }}
                >
                  {sessionData.participant?.initials}
                </div>
                <div className="flex-1">
                  <p 
                    className="text-xs font-bold"
                    style={{ color: "#111827" }}
                  >
                    {sessionData.participant?.name}
                  </p>
                  <p 
                    className="text-[10px]"
                    style={{ color: "#6B7280" }}
                  >
                    Private session
                  </p>
                </div>
                <button 
                  className="transition-colors"
                  style={{ color: "#6B7280" }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#111827"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "#6B7280"}
                >
                  <Edit className="w-4.5 h-4.5" />
                </button>
              </div>
            </section>

            {/* Preparation Checklist */}
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 
                  className="text-xs font-bold uppercase tracking-[0.1em]"
                  style={{ color: "#6B7280" }}
                >
                  Preparation
                </h3>
                <button 
                  className="text-[10px] font-bold hover:underline"
                  style={{ color: "#111827" }}
                >
                  Add Task
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {prepTasks.map((task) => (
                  <label
                    key={task.id}
                    className="flex items-center gap-3 group cursor-pointer py-1.5"
                    style={{ borderBottom: "1px solid rgba(243, 244, 246, 0.5)" }}
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                      className="shrink-0 appearance-none w-[1.15rem] h-[1.15rem] rounded-full border-[1.5px] cursor-pointer relative transition-all"
                      style={{
                        borderColor: task.completed ? "#111827" : "#D1D5DB",
                        backgroundColor: task.completed ? "#111827" : "transparent"
                      }}
                    />
                    <span 
                      className={`text-xs transition-colors ${
                        task.completed ? "line-through opacity-50" : ""
                      }`}
                      style={{ 
                        color: task.completed ? "#6B7280" : "#6B7280"
                      }}
                      onMouseEnter={(e) => {
                        if (!task.completed) e.currentTarget.style.color = "#111827";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#6B7280";
                      }}
                    >
                      {task.text}
                    </span>
                  </label>
                ))}
              </div>
            </section>

            {/* Intentions */}
            <section className="space-y-3">
              <h3 
                className="text-xs font-bold uppercase tracking-[0.1em]"
                style={{ color: "#6B7280" }}
              >
                Intentions
              </h3>
              <div 
                className="p-4 border rounded-2xl"
                style={{
                  backgroundColor: "rgba(238, 242, 255, 0.3)",
                  borderColor: "rgba(199, 210, 254, 0.5)"
                }}
              >
                <p 
                  className="text-xs leading-relaxed font-medium"
                  style={{ color: "rgba(67, 56, 202, 0.7)" }}
                >
                  {sessionData.intentions}
                </p>
              </div>
            </section>
          </div>

          {/* Footer Actions */}
          <div 
            className="px-8 py-8 border-t shrink-0"
            style={{
              borderColor: "rgba(243, 244, 246, 0.8)",
              backgroundColor: "rgba(255, 255, 255, 0.4)",
              backdropFilter: "blur(12px)"
            }}
          >
            <div className="space-y-4">
              <div className="flex gap-3">
                <button
                  onClick={onStartSession}
                  className="flex-1 py-3 rounded-xl shadow-lg transition-all font-bold tracking-wide text-xs uppercase flex items-center justify-center gap-2 group"
                  style={{
                    backgroundColor: "#111827",
                    color: "white",
                    boxShadow: "0 10px 15px -3px rgba(17, 24, 39, 0.2)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(17, 24, 39, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(17, 24, 39, 0.2)";
                  }}
                >
                  <Zap className="w-4 h-4" />
                  Start Session
                </button>
                <button 
                  className="w-12 h-12 flex items-center justify-center rounded-xl border shadow-sm transition-all"
                  style={{
                    backgroundColor: "white",
                    borderColor: "#E5E7EB",
                    color: "#6B7280"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#F9FAFB";
                    e.currentTarget.style.color = "#111827";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "white";
                    e.currentTarget.style.color = "#6B7280";
                  }}
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

              <div className="flex justify-between items-center px-1">
                {onDeleteEvent && (
                  <button 
                    onClick={onDeleteEvent}
                    className="text-[10px] font-bold uppercase tracking-widest transition-colors"
                    style={{ color: "#6B7280" }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "#EF4444"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "#6B7280"}
                  >
                    Delete Event
                  </button>
                )}
                <span 
                  className="text-[10px] font-medium italic"
                  style={{ color: "rgba(107, 114, 128, 0.4)" }}
                >
                  Synced with Google Calendar
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Checkbox Styles */}
      <style>{`
        @keyframes slideIn {
          from { 
            transform: translateX(100%); 
            opacity: 0; 
          }
          to { 
            transform: translateX(0); 
            opacity: 1; 
          }
        }
        
        input[type="checkbox"]:checked::after {
          content: '✓';
          color: white;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 0.75rem;
          font-weight: bold;
        }

        /* Hide scrollbar */
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
}