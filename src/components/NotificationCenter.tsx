import { useState, useEffect, useRef } from "react";
import {
  Bell,
  X,
  CheckCircle,
  Clock,
  Zap,
  Calendar,
  Users,
  AlertTriangle,
  Check,
  Trash2,
} from "lucide-react";
import { toast } from "sonner@2.0.3";
import { storageService } from "../services/storage-service";
import { useTasks } from "../hooks/useTasks";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "reminder";
  timestamp: Date;
  read: boolean;
  icon: "task" | "focus" | "calendar" | "team" | "energy" | "alert";
}

const NOTIF_KEY = "kaal_notifications";

function generateNotifications(taskCount: number): Notification[] {
  const now = new Date();

  const notifications: Notification[] = [
    {
      id: "n-1",
      title: "Focus Streak Active",
      message: `You're on a roll! Keep your streak going with a deep work session.`,
      type: "success",
      timestamp: new Date(now.getTime() - 15 * 60 * 1000),
      read: false,
      icon: "focus",
    },
    {
      id: "n-2",
      title: "Task Reminder",
      message: `You have ${taskCount} active task${taskCount !== 1 ? "s" : ""} waiting for your attention.`,
      type: "reminder",
      timestamp: new Date(now.getTime() - 45 * 60 * 1000),
      read: false,
      icon: "task",
    },
    {
      id: "n-3",
      title: "Energy Check-In",
      message: "It's been a while since you logged your energy level. How are you feeling?",
      type: "info",
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      read: false,
      icon: "energy",
    },
    {
      id: "n-4",
      title: "Upcoming Meeting",
      message: "Team sync meeting starts in 30 minutes.",
      type: "warning",
      timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      read: true,
      icon: "calendar",
    },
    {
      id: "n-5",
      title: "Weekly Insights Ready",
      message: "Your weekly productivity report is available. Check your insights!",
      type: "info",
      timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      read: true,
      icon: "task",
    },
  ];

  return notifications;
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Get tasks from Supabase
  const { tasks } = useTasks();
  const activeTasks = (tasks || []).filter((t) => t.status !== 'completed');

  useEffect(() => {
    setNotifications(generateNotifications(activeTasks.length));
  }, [activeTasks.length]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast.info("Notification dismissed");
  };

  const getIcon = (icon: Notification["icon"]) => {
    switch (icon) {
      case "task":
        return <CheckCircle className="w-4 h-4" />;
      case "focus":
        return <Zap className="w-4 h-4" />;
      case "calendar":
        return <Calendar className="w-4 h-4" />;
      case "team":
        return <Users className="w-4 h-4" />;
      case "energy":
        return <Zap className="w-4 h-4" />;
      case "alert":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getIconColor = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return { bg: "rgba(220, 252, 231, 0.8)", color: "#16a34a" };
      case "warning":
        return { bg: "rgba(254, 243, 199, 0.8)", color: "#d97706" };
      case "reminder":
        return { bg: "rgba(219, 234, 254, 0.8)", color: "#2563eb" };
      default:
        return { bg: "rgba(243, 244, 246, 0.8)", color: "#6B7280" };
    }
  };

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-900 transition-colors hover:bg-white/50 rounded-full"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            className="absolute top-1.5 right-1.5 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1"
            style={{
              backgroundColor: "#EF4444",
              boxShadow: "0 0 10px rgba(239, 68, 68, 0.5)",
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-96 rounded-2xl overflow-hidden z-50"
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            border: "1px solid rgba(255, 255, 255, 0.6)",
            boxShadow:
              "0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255,255,255,0.3)",
            animation: "notifSlideIn 0.2s ease-out",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: "rgba(229, 231, 235, 0.5)" }}
          >
            <div>
              <h3
                className="text-sm font-semibold"
                style={{ color: "#111827" }}
              >
                Notifications
              </h3>
              <p className="text-[11px]" style={{ color: "#9CA3AF" }}>
                {unreadCount} unread
              </p>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] font-medium px-2 py-1 rounded-lg transition-colors hover:bg-gray-100"
                  style={{ color: "#6B7280" }}
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" style={{ color: "#9CA3AF" }} />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell
                  className="w-8 h-8 mx-auto mb-3"
                  style={{ color: "#D1D5DB" }}
                />
                <p className="text-sm" style={{ color: "#9CA3AF" }}>
                  All caught up!
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const iconStyle = getIconColor(notif.type);
                return (
                  <div
                    key={notif.id}
                    className="group flex gap-3 px-5 py-4 transition-colors cursor-pointer relative"
                    style={{
                      backgroundColor: notif.read
                        ? "transparent"
                        : "rgba(249, 250, 251, 0.8)",
                    }}
                    onClick={() => markAsRead(notif.id)}
                    onMouseEnter={(e) => {
                      if (notif.read)
                        e.currentTarget.style.backgroundColor =
                          "rgba(249, 250, 251, 0.5)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = notif.read
                        ? "transparent"
                        : "rgba(249, 250, 251, 0.8)";
                    }}
                  >
                    {!notif.read && (
                      <div
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: "#3B82F6" }}
                      />
                    )}
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{
                        backgroundColor: iconStyle.bg,
                        color: iconStyle.color,
                      }}
                    >
                      {getIcon(notif.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="text-sm font-medium truncate"
                          style={{
                            color: "#111827",
                            opacity: notif.read ? 0.7 : 1,
                          }}
                        >
                          {notif.title}
                        </span>
                        <span
                          className="text-[10px] flex-shrink-0"
                          style={{ color: "#9CA3AF" }}
                        >
                          {formatTime(notif.timestamp)}
                        </span>
                      </div>
                      <p
                        className="text-xs mt-0.5 line-clamp-2"
                        style={{
                          color: "#6B7280",
                          opacity: notif.read ? 0.6 : 1,
                        }}
                      >
                        {notif.message}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissNotification(notif.id);
                      }}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 flex-shrink-0 self-center"
                    >
                      <Trash2
                        className="w-3.5 h-3.5"
                        style={{ color: "#9CA3AF" }}
                      />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div
            className="px-5 py-3 border-t text-center"
            style={{
              borderColor: "rgba(229, 231, 235, 0.5)",
              backgroundColor: "rgba(249, 250, 251, 0.5)",
            }}
          >
            <button
              className="text-[11px] font-medium transition-colors hover:underline"
              style={{ color: "#6B7280" }}
              onClick={() => {
                setIsOpen(false);
                toast.info("Opening all notifications...");
              }}
            >
              View all notifications
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes notifSlideIn {
          0% {
            opacity: 0;
            transform: translateY(-4px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}