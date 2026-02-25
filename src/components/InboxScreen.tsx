import { useState } from "react";
import { 
  Filter,
  Mail,
  AlertTriangle,
  AtSign,
  CheckCircle2,
  Calendar,
  Eye,
  Reply,
  Trash2,
  Check,
  Archive,
  CheckCheck,
  FileEdit,
  Sparkles
} from "lucide-react";
import { useProfile } from "../context/ProfileContext";
import { toast } from "sonner@2.0.3";

interface Signal {
  id: string;
  icon: any;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  time: string;
  category: "today" | "yesterday";
  actions?: Array<{ label: string; icon?: any; primary?: boolean; }>;
  read?: boolean;
}

export function InboxScreen() {
  const { profile } = useProfile();
  const [filterCategory, setFilterCategory] = useState<"all" | "today" | "yesterday">("all");
  const [signals, setSignals] = useState<Signal[]>([
    {
      id: "1",
      icon: Mail,
      iconColor: "#2563EB",
      iconBg: "#EFF6FF",
      title: "Project Alpha Update",
      description: "Sarah requested a review on the latest Q3 financial projections. Deadline is approaching EOD.",
      time: "10m ago",
      category: "today",
      actions: [
        { label: "Review Request", icon: Eye, primary: true },
        { label: "Snooze" }
      ]
    },
    {
      id: "2",
      icon: AlertTriangle,
      iconColor: "#D97706",
      iconBg: "#FEF3C7",
      title: "System Maintenance",
      description: "Scheduled downtime for server upgrades tonight at 02:00 UTC. Please save your work.",
      time: "1h ago",
      category: "today"
    },
    {
      id: "3",
      icon: AtSign,
      iconColor: "#9333EA",
      iconBg: "#FAF5FF",
      title: "Mentioned in #Design-System",
      description: '@AlexM commented: "Can we double check the contrast ratios on the dark mode palette?"',
      time: "2h ago",
      category: "today",
      actions: [
        { label: "Reply", icon: Reply, primary: true }
      ]
    },
    {
      id: "4",
      icon: CheckCircle2,
      iconColor: "#059669",
      iconBg: "#D1FAE5",
      title: "Task Completed: Homepage Revamp",
      description: "The engineering team marked this task as complete. Ready for QA review.",
      time: "Yesterday",
      category: "yesterday",
      read: true
    },
    {
      id: "5",
      icon: Calendar,
      iconColor: "#6B7280",
      iconBg: "#F9FAFB",
      title: "New Event Invitation",
      description: "Quarterly All-Hands Meeting. Friday, 10:00 AM.",
      time: "Yesterday",
      category: "yesterday",
      actions: [
        { label: "Accept", primary: true },
        { label: "Decline" }
      ],
      read: true
    }
  ]);

  const todaySignals = signals.filter(s => s.category === "today");
  const yesterdaySignals = signals.filter(s => s.category === "yesterday");
  const displayTodaySignals = filterCategory === "yesterday" ? [] : todaySignals;
  const displayYesterdaySignals = filterCategory === "today" ? [] : yesterdaySignals;

  const handleFilter = () => {
    const options: Array<"all" | "today" | "yesterday"> = ["all", "today", "yesterday"];
    const currentIndex = options.indexOf(filterCategory);
    const nextFilter = options[(currentIndex + 1) % options.length];
    setFilterCategory(nextFilter);
    toast.info(`Filter: ${nextFilter === "all" ? "All signals" : nextFilter === "today" ? "Today only" : "Yesterday only"}`);
  };

  const handleDismissSignal = (signalId: string) => {
    setSignals(prev => prev.filter(s => s.id !== signalId));
    toast.success("Signal dismissed");
  };

  const handleSweepAll = () => {
    const readSignals = signals.filter(s => s.read);
    if (readSignals.length === 0 && signals.length > 0) {
      // Mark all as read first
      setSignals(prev => prev.map(s => ({ ...s, read: true })));
      toast.success("All signals marked as read");
    } else {
      // Remove read signals
      setSignals(prev => prev.filter(s => !s.read));
      toast.success(`${readSignals.length} read signal${readSignals.length !== 1 ? 's' : ''} swept`);
    }
  };

  const handleActionClick = (signalId: string, actionLabel: string) => {
    if (actionLabel === "Snooze" || actionLabel === "Later") {
      toast.info("Snoozed for 1 hour");
      handleDismissSignal(signalId);
    } else if (actionLabel === "Decline") {
      toast.info("Event declined");
      handleDismissSignal(signalId);
    } else if (actionLabel === "Accept") {
      toast.success("Event accepted! Added to your calendar.");
      handleDismissSignal(signalId);
    } else {
      toast.success(`${actionLabel} action completed`);
      setSignals(prev => prev.map(s => s.id === signalId ? { ...s, read: true } : s));
    }
  };

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
            Inbox
          </h1>
          <p 
            className="text-2xl italic"
            style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
          >
            Signal Center
          </p>
        </div>

        <div className="flex items-center gap-6">
          {/* Zero Inbox Goal Badge */}
          <div 
            className="flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.6)",
              borderColor: "rgba(255, 255, 255, 0.8)",
              backdropFilter: "blur(4px)"
            }}
          >
            <Sparkles 
              className="w-4 h-4 text-emerald-600"
              fill="currentColor"
            />
            <span className="text-xs font-bold tracking-wide" style={{ color: "#111827" }}>
              ZERO INBOX GOAL
            </span>
          </div>

          <div className="h-10 w-px bg-gray-200"></div>

          <button 
            className="relative p-2 transition-colors rounded-full"
            style={{ color: "#6B7280" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#111827";
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#6B7280";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            onClick={handleFilter}
          >
            <Filter className="w-5 h-5" />
          </button>

          <div className="w-10 h-10 rounded-full ring-2 ring-white shadow-lg overflow-hidden">
            <img 
              src={profile.profileImage} 
              alt="User" 
              className="w-full h-full object-cover" 
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-10 scroll-smooth">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Title Section */}
          <div className="flex justify-between items-end mb-4">
            <div>
              <h2 
                className="text-4xl font-medium tracking-tight leading-tight"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  color: "#111827",
                  animation: "settle 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards"
                }}
              >
                Incoming Signals
              </h2>
              <p 
                className="mt-2 text-base font-light tracking-wide opacity-0"
                style={{ 
                  color: "#6B7280",
                  animation: "fadeInUp 0.8s ease-out 0.1s forwards"
                }}
              >
                Review your latest notifications and action items.
              </p>
            </div>

            <button 
              className="px-5 py-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-2 font-medium group ring-1"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.5)",
                color: "#111827",
                ringColor: "rgba(229, 231, 235, 0.5)",
                backdropFilter: "blur(4px)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "white";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.5)";
              }}
              onClick={handleSweepAll}
            >
              <CheckCheck className="w-5 h-5" />
              Sweep All
            </button>
          </div>

          {/* Signal Feed */}
          <div className="space-y-6">
            {/* Today Section */}
            <div 
              className="opacity-0"
              style={{ animation: "fadeInUp 0.8s ease-out 0.2s forwards" }}
            >
              <h3 
                className="text-xs font-bold uppercase tracking-widest mb-4 pl-1"
                style={{ color: "#6B7280" }}
              >
                Today
              </h3>

              <div className="space-y-3">
                {displayTodaySignals.map((signal) => {
                  const Icon = signal.icon;
                  return (
                    <SignalCard 
                      key={signal.id}
                      signal={signal}
                      Icon={Icon}
                      onActionClick={handleActionClick}
                      onDismiss={handleDismissSignal}
                    />
                  );
                })}
              </div>
            </div>

            {/* Yesterday Section */}
            <div 
              className="opacity-0"
              style={{ animation: "fadeInUp 0.8s ease-out 0.4s forwards" }}
            >
              <h3 
                className="text-xs font-bold uppercase tracking-widest mb-4 pl-1 mt-8"
                style={{ color: "#6B7280" }}
              >
                Yesterday
              </h3>

              <div className="space-y-3 opacity-80 hover:opacity-100 transition-opacity duration-500">
                {displayYesterdaySignals.map((signal) => {
                  const Icon = signal.icon;
                  return (
                    <SignalCard 
                      key={signal.id}
                      signal={signal}
                      Icon={Icon}
                      isOld={true}
                      onActionClick={handleActionClick}
                      onDismiss={handleDismissSignal}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <div className="h-24"></div>
        </div>
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
      `}</style>
    </div>
  );
}

interface SignalCardProps {
  signal: Signal;
  Icon: any;
  isOld?: boolean;
  onActionClick?: (signalId: string, actionLabel: string) => void;
  onDismiss?: (signalId: string) => void;
}

function SignalCard({ signal, Icon, isOld, onActionClick, onDismiss }: SignalCardProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div 
      className="relative rounded-2xl p-6 overflow-hidden group transition-all duration-300"
      style={{
        background: isOld ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 255, 255, 0.6)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.8)",
        cursor: "pointer"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255, 255, 255, 0.85)";
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 10px 30px -10px rgba(0,0,0,0.08)";
        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 1)";
        setShowActions(true);
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = isOld ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 255, 255, 0.6)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.8)";
        setShowActions(false);
      }}
    >
      {/* Left accent bar on hover */}
      <div 
        className="absolute top-0 left-0 bottom-0 w-1 transition-all duration-300"
        style={{
          background: showActions ? "#111827" : "transparent"
        }}
      ></div>

      <div className="flex items-start gap-5">
        {/* Icon */}
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-sm"
          style={{
            backgroundColor: signal.iconBg,
            color: signal.iconColor,
            borderColor: signal.iconColor + "20"
          }}
        >
          <Icon 
            className="w-6 h-6"
            fill={signal.icon === Mail || signal.icon === CheckCircle2 || signal.icon === AtSign || signal.icon === AlertTriangle ? "currentColor" : "none"}
          />
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h4 
              className="text-lg font-bold"
              style={{ 
                fontFamily: "'Playfair Display', serif",
                color: "#111827"
              }}
            >
              {signal.title}
            </h4>
            <span 
              className="text-xs font-medium px-2 py-1 rounded-md border"
              style={{
                color: "#6B7280",
                backgroundColor: "rgba(255, 255, 255, 0.5)",
                borderColor: "rgba(255, 255, 255, 0.6)"
              }}
            >
              {signal.time}
            </span>
          </div>

          <p 
            className="text-sm mt-1 leading-relaxed"
            style={{ color: "#6B7280" }}
            dangerouslySetInnerHTML={{ 
              __html: signal.description.replace(/@(\w+)/g, '<strong>@$1</strong>')
            }}
          />

          {/* Action Buttons */}
          {signal.actions && signal.actions.length > 0 && (
            <div className="mt-4 flex gap-3">
              {signal.actions.map((action, index) => {
                const ActionIcon = action.icon;
                return action.primary ? (
                  <button
                    key={index}
                    onClick={() => onActionClick?.(signal.id, action.label)}
                    className="px-4 py-2 rounded-lg border text-xs font-bold uppercase tracking-wide transition-all duration-300 shadow-sm flex items-center gap-2"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.6)",
                      borderColor: "rgba(255, 255, 255, 0.6)",
                      color: "#111827"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = "0 0 15px rgba(0,0,0,0.05)";
                      e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.9)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
                      e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.6)";
                    }}
                  >
                    {ActionIcon && <ActionIcon className="w-4 h-4" />}
                    {action.label}
                  </button>
                ) : (
                  <button
                    key={index}
                    onClick={() => onActionClick?.(signal.id, action.label)}
                    className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors"
                    style={{ color: "#6B7280" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#111827";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#6B7280";
                    }}
                  >
                    {action.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Delete/Archive Icon */}
        <div 
          className="absolute top-6 right-6 transition-opacity"
          style={{ opacity: showActions ? 1 : 0 }}
        >
          <button 
            className="text-gray-400 transition-colors"
            onClick={() => onDismiss?.(signal.id)}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = signal.read ? "#6B7280" : "#EF4444";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#9CA3AF";
            }}
          >
            {signal.read ? (
              <Archive className="w-5 h-5" />
            ) : signal.actions ? (
              <Trash2 className="w-5 h-5" />
            ) : (
              <Check className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}