import { motion } from "motion/react";
import { 
  Plus, 
  Droplet, 
  Mail, 
  Eye,
  Edit2,
  Trash2,
  Repeat,
  Monitor,
  Smartphone,
  Mail as MailIcon,
  Info,
  Brain,
  Mic,
  Sparkles
} from "lucide-react";
import { useState, useEffect } from "react";
import { SmartReminderModal } from "./SmartReminderModal";
import { storageService, Reminder } from "../services/storage-service";
import { toast } from "sonner";

export function RemindersScreen() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [dismissedNudges, setDismissedNudges] = useState<Set<number>>(new Set());
  const [reminderFilter, setReminderFilter] = useState<"all" | "scheduled" | "recurring">("all");
  const [toggles, setToggles] = useState({
    desktop: true,
    mobile: false,
    email: true,
  });

  // Load reminders from storage on mount
  useEffect(() => {
    const loadedReminders = storageService.getReminders();
    setReminders(loadedReminders);
  }, []);

  const handleToggle = (key: keyof typeof toggles) => {
    setToggles(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleDeleteReminder = (reminderId: string, reminderTitle: string) => {
    storageService.deleteReminder(reminderId);
    const updatedReminders = storageService.getReminders();
    setReminders(updatedReminders);
    toast.success(`"${reminderTitle}" deleted`);
  };

  const handleAddReminder = (newReminder: Reminder) => {
    storageService.saveReminder(newReminder);
    const updatedReminders = storageService.getReminders();
    setReminders(updatedReminders);
    setIsModalOpen(false);
    toast.success("Reminder created!");
  };

  const toggleComplete = (reminderId: string) => {
    const reminder = reminders.find(r => r.id === reminderId);
    if (reminder) {
      const updatedReminder = { ...reminder, completed: !reminder.completed };
      storageService.saveReminder(updatedReminder);
      const updatedReminders = storageService.getReminders();
      setReminders(updatedReminders);
      toast.success(updatedReminder.completed ? "Reminder completed!" : "Reminder reopened");
    }
  };

  const handleEditReminder = (reminder: Reminder) => {
    toast.info(`Editing "${reminder.title}"`, {
      description: "Edit functionality coming soon. You can delete and recreate the reminder."
    });
  };

  const handleNudgeAction = (nudgeId: number, action: string) => {
    if (action === "Accept" || action === "Done" || action === "Draft") {
      toast.success(`${action} action completed!`);
    }
    setDismissedNudges(prev => new Set(prev).add(nudgeId));
  };

  // Removed mockup smart nudges - only show real reminder data
  const smartNudges: any[] = [];

  const activeNudges = smartNudges.filter(n => !dismissedNudges.has(n.id));
  
  const filteredReminders = reminders.filter(r => {
    if (reminderFilter === "scheduled") return !r.isRecurring;
    if (reminderFilter === "recurring") return r.isRecurring;
    return true;
  });

  const notificationChannels = [
    {
      id: "desktop",
      icon: Monitor,
      title: "Desktop",
      subtitle: "Banners & Sounds",
      enabled: toggles.desktop
    },
    {
      id: "mobile",
      icon: Smartphone,
      title: "Mobile Push",
      subtitle: "Critical Only",
      enabled: toggles.mobile
    },
    {
      id: "email",
      icon: MailIcon,
      title: "Email Digest",
      subtitle: "Daily Summary",
      enabled: toggles.email
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
            Reminders
          </h1>
          <p 
            className="text-2xl italic"
            style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
          >
            Tuesday, October 24
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative group">
            <button 
              className="flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm transition-all"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.6)",
                borderColor: "rgba(255, 255, 255, 0.8)",
                backdropFilter: "blur(4px)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.6)";
              }}
            >
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-bold tracking-wide" style={{ color: "#111827" }}>
                AI ACTIVE
              </span>
            </button>
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
                Smart Reminders
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="mt-3 text-lg font-light tracking-wide max-w-lg"
                style={{ color: "#6B7280" }}
              >
                Manage your focus with intelligent scheduling and AI-driven nudges.
              </motion.p>
            </div>
            <button 
              className="px-7 py-4 rounded-xl text-white flex items-center gap-2 font-medium group ring-1 relative overflow-hidden transition-all duration-300 transform hover:scale-[1.03] active:scale-95"
              style={{
                backgroundColor: "#111827",
                ringColor: "rgba(255, 255, 255, 0.2)",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255,255,255,0.1)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#1F2937";
                e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#111827";
                e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255,255,255,0.1)";
              }}
              onClick={() => setIsModalOpen(true)}
            >
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
              ></div>
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" strokeWidth={2.5} />
              New Reminder
            </button>
          </div>

          {/* Smart Nudges Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="relative"
          >
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" fill="#9333ea" strokeWidth={2} />
              <h3 className="text-xs font-bold tracking-wide uppercase" style={{ color: "#111827" }}>
                Smart Nudges
              </h3>
              <div 
                className="h-px flex-1 ml-4"
                style={{
                  background: "linear-gradient(to right, rgba(216, 180, 254, 1), transparent)"
                }}
              ></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {activeNudges.map((nudge, index) => (
                <motion.div
                  key={nudge.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                  className="rounded-3xl p-6 relative overflow-hidden group cursor-pointer transition-transform duration-500"
                  style={{
                    background: `linear-gradient(to bottom right, rgba(255, 255, 255, 0.6), ${nudge.gradientFrom})`,
                    backdropFilter: "blur(30px)",
                    WebkitBackdropFilter: "blur(30px)",
                    border: "1px solid rgba(255, 255, 255, 0.6)",
                    boxShadow: nudge.hasGlow ? "0 0 20px rgba(139, 92, 246, 0.15), inset 0 0 20px rgba(255,255,255,0.5)" : "0 10px 40px -10px rgba(139, 92, 246, 0.1)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ backgroundColor: "rgba(255, 255, 255, 0.4)" }}
                  ></div>
                  <div 
                    className="absolute -right-10 -top-10 w-32 h-32 rounded-full blur-2xl group-hover:opacity-30 transition-colors"
                    style={{ backgroundColor: nudge.ambientColor, opacity: 0.2 }}
                  ></div>
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <span 
                        className="p-2 rounded-xl shadow-sm border"
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.6)",
                          borderColor: "rgba(255, 255, 255, 0.5)",
                          color: nudge.iconColor
                        }}
                      >
                        <nudge.icon className="w-5 h-5" strokeWidth={2} />
                      </span>
                      <span 
                        className="text-[10px] font-bold px-2 py-1 rounded-full border"
                        style={{
                          color: `${nudge.badgeColor}99`,
                          backgroundColor: nudge.badgeBg,
                          borderColor: `${nudge.badgeColor}33`
                        }}
                      >
                        {nudge.badge}
                      </span>
                    </div>
                    <h4 
                      className="text-xl font-bold mb-2"
                      style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
                    >
                      {nudge.title}
                    </h4>
                    <p className="text-sm leading-relaxed mb-4" style={{ color: "#6B7280" }}>
                      {nudge.description}
                    </p>
                    <div className="flex items-center gap-3">
                      <button 
                        className="px-3 py-1.5 text-xs font-bold rounded-lg text-white transition-colors"
                        style={{ backgroundColor: "#111827" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#1F2937";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#111827";
                        }}
                        onClick={() => handleNudgeAction(nudge.id, nudge.actions[0])}
                      >
                        {nudge.actions[0]}
                      </button>
                      <button 
                        className="px-3 py-1.5 text-xs font-bold rounded-lg transition-colors"
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.5)",
                          color: "#6B7280"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#FFFFFF";
                          e.currentTarget.style.color = "#111827";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.5)";
                          e.currentTarget.style.color = "#6B7280";
                        }}
                        onClick={() => handleNudgeAction(nudge.id, nudge.actions[1])}
                      >
                        {nudge.actions[1]}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Main Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="grid grid-cols-12 gap-8"
          >
            {/* Upcoming Reminders - Left Column */}
            <div className="col-span-12 lg:col-span-8 rounded-3xl p-8 border"
              style={{
                background: "linear-gradient(160deg, rgba(255, 255, 255, 0.55) 0%, rgba(255, 255, 255, 0.4) 100%)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                borderColor: "rgba(255, 255, 255, 0.4)",
                boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)"
              }}
            >
              <div className="flex items-center justify-between mb-8">
                <h3 
                  className="text-xl font-medium italic"
                  style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
                >
                  Upcoming Reminders
                </h3>
                <div className="flex gap-2">
                  <button 
                    className="text-xs font-bold px-3 py-1 rounded-full shadow-sm border"
                    style={{
                      backgroundColor: reminderFilter === "all" ? "#FFFFFF" : "transparent",
                      color: "#111827",
                      borderColor: reminderFilter === "all" ? "#F3F4F6" : "transparent"
                    }}
                    onClick={() => setReminderFilter("all")}
                  >
                    Today
                  </button>
                  <button 
                    className="text-xs font-bold px-3 py-1 rounded-full transition-colors"
                    style={{ 
                      color: reminderFilter === "scheduled" ? "#111827" : "#6B7280",
                      backgroundColor: reminderFilter === "scheduled" ? "#FFFFFF" : "transparent"
                    }}
                    onClick={() => setReminderFilter("scheduled")}
                  >
                    Scheduled
                  </button>
                  <button 
                    className="text-xs font-bold px-3 py-1 rounded-full transition-colors"
                    style={{ 
                      color: reminderFilter === "recurring" ? "#111827" : "#6B7280",
                      backgroundColor: reminderFilter === "recurring" ? "#FFFFFF" : "transparent"
                    }}
                    onClick={() => setReminderFilter("recurring")}
                  >
                    Recurring
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {filteredReminders.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm" style={{ color: "#6B7280" }}>
                      No {reminderFilter === "all" ? "" : reminderFilter} reminders found.
                    </p>
                  </div>
                )}
                {filteredReminders.map((reminder, index) => (
                  <div
                    key={reminder.id}
                    className="group flex items-center p-4 border rounded-2xl transition-all duration-300 shadow-sm cursor-pointer"
                    style={{
                      backgroundColor: reminder.isRecurring ? "rgba(219, 234, 254, 0.3)" : "rgba(255, 255, 255, 0.4)",
                      borderColor: reminder.isRecurring ? "rgba(37, 99, 235, 0.1)" : "rgba(255, 255, 255, 0.6)"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = reminder.isRecurring ? "rgba(219, 234, 254, 0.6)" : "rgba(255, 255, 255, 0.7)";
                      e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = reminder.isRecurring ? "rgba(219, 234, 254, 0.3)" : "rgba(255, 255, 255, 0.4)";
                      e.currentTarget.style.boxShadow = "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
                    }}
                  >
                    <div 
                      className="flex items-center justify-center w-10 h-10 rounded-full mr-4 transition-colors"
                      style={{
                        backgroundColor: reminder.isRecurring ? "#FFFFFF" : "#F3F4F6",
                        color: reminder.isRecurring ? "#3b82f6" : "#9CA3AF",
                        border: reminder.isRecurring ? "1px solid rgba(37, 99, 235, 0.1)" : "none"
                      }}
                    >
                      {reminder.isRecurring ? (
                        <Repeat className="w-5 h-5" strokeWidth={2} />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-current"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 
                          className="text-base font-bold transition-colors"
                          style={{ color: "#111827" }}
                        >
                          {reminder.title}
                        </h4>
                        {reminder.time ? (
                          <span 
                            className="text-xs font-bold px-2 py-1 rounded border"
                            style={{
                              color: "#6B7280",
                              backgroundColor: "rgba(255, 255, 255, 0.5)",
                              borderColor: "#F3F4F6"
                            }}
                          >
                            {reminder.time}
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="flex h-2 w-2 rounded-full bg-blue-500"></span>
                            <span 
                              className="text-xs font-bold"
                              style={{ color: "rgba(37, 99, 235, 0.7)" }}
                            >
                              {reminder.recurring}
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm mt-1 opacity-80" style={{ color: "#6B7280" }}>
                        {reminder.description}
                      </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-4 flex gap-2">
                      <button 
                        className="p-2 rounded-full transition-colors"
                        style={{ color: "#6B7280" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#FFFFFF";
                          e.currentTarget.style.color = "#111827";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "#6B7280";
                        }}
                        onClick={() => handleEditReminder(reminder)}
                      >
                        <Edit2 className="w-[18px] h-[18px]" strokeWidth={2} />
                      </button>
                      <button 
                        className="p-2 rounded-full transition-colors"
                        style={{ color: "#6B7280" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#FFFFFF";
                          e.currentTarget.style.color = "#ef4444";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "#6B7280";
                        }}
                        onClick={() => handleDeleteReminder(reminder.id, reminder.title)}
                      >
                        <Trash2 className="w-[18px] h-[18px]" strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
              {/* Notification Channels */}
              <div 
                className="p-6 rounded-3xl border"
                style={{
                  background: "linear-gradient(160deg, rgba(255, 255, 255, 0.65) 0%, rgba(255, 255, 255, 0.4) 100%)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  borderColor: "rgba(255, 255, 255, 0.6)",
                  boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)"
                }}
              >
                <h3 
                  className="text-lg font-medium italic mb-6"
                  style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
                >
                  Notification Channels
                </h3>
                <div className="space-y-6">
                  {notificationChannels.map((channel) => (
                    <div key={channel.id} className="flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-colors"
                          style={{
                            backgroundColor: "#FFFFFF",
                            color: "#6B7280"
                          }}
                        >
                          <channel.icon className="w-5 h-5" strokeWidth={2} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold" style={{ color: "#111827" }}>
                            {channel.title}
                          </h4>
                          <p 
                            className="text-[10px] uppercase tracking-wider"
                            style={{ color: "#6B7280" }}
                          >
                            {channel.subtitle}
                          </p>
                        </div>
                      </div>
                      <div className="relative inline-block w-12 mr-2 align-middle select-none">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={channel.enabled}
                          onChange={() => handleToggle(channel.id as keyof typeof toggles)}
                        />
                        <div 
                          className="w-12 h-6 rounded-full cursor-pointer transition-colors duration-300"
                          style={{
                            backgroundColor: channel.enabled ? "#111827" : "#E5E7EB"
                          }}
                          onClick={() => handleToggle(channel.id as keyof typeof toggles)}
                        >
                          <div 
                            className="absolute w-6 h-6 rounded-full bg-white border-4 shadow-sm transition-all duration-300 ease-in-out cursor-pointer"
                            style={{
                              borderColor: channel.enabled ? "#111827" : "#D1D5DB",
                              right: channel.enabled ? 0 : "auto",
                              left: channel.enabled ? "auto" : 0
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div 
                  className="mt-8 pt-6"
                  style={{ borderTop: "1px solid rgba(229, 231, 235, 0.5)" }}
                >
                  <div 
                    className="rounded-2xl p-4 flex items-start gap-3"
                    style={{ backgroundColor: "rgba(17, 24, 39, 0.05)" }}
                  >
                    <Info className="w-4 h-4 mt-0.5" style={{ color: "#6B7280" }} strokeWidth={2} />
                    <p className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>
                      "Critical Only" mode filters non-urgent notifications during deep work sessions based on your calendar.
                    </p>
                  </div>
                </div>
              </div>

              {/* Focus Mode Card */}
              <div 
                className="p-6 rounded-3xl border relative overflow-hidden group"
                style={{
                  background: "linear-gradient(160deg, rgba(255, 255, 255, 0.65) 0%, rgba(255, 255, 255, 0.4) 100%)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  borderColor: "rgba(255, 255, 255, 0.6)",
                  boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)"
                }}
              >
                <div 
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(to bottom right, rgba(124, 58, 237, 0.05), rgba(37, 99, 235, 0.05))"
                  }}
                ></div>
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div 
                    className="w-16 h-16 rounded-full shadow-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500"
                    style={{ backgroundColor: "#FFFFFF" }}
                  >
                    <Brain 
                      className="w-8 h-8"
                      style={{
                        color: "#7c3aed"
                      }}
                      strokeWidth={2}
                    />
                  </div>
                  <h3 className="text-lg font-bold" style={{ color: "#111827" }}>
                    Focus Mode
                  </h3>
                  <p className="text-sm mt-2 mb-6" style={{ color: "#6B7280" }}>
                    Currently inactive. Start a session to mute distractions.
                  </p>
                  <button 
                    className="w-full py-3 rounded-xl text-white font-bold text-sm shadow-lg transition-all active:scale-95"
                    style={{ backgroundColor: "#111827" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#1F2937";
                      e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#111827";
                      e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)";
                    }}
                  >
                    Start Focus
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        <div className="h-24"></div>
      </div>

      {/* Smart Reminder Modal */}
      <SmartReminderModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddReminder={handleAddReminder} />
    </div>
  );
}