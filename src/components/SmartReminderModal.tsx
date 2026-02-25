import { motion, AnimatePresence } from "motion/react";
import { X, Calendar, Clock, AlarmClock, Bot } from "lucide-react";
import { useState } from "react";
import { Reminder } from "../services/storage-service";

interface SmartReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddReminder?: (reminder: Reminder) => void;
}

export function SmartReminderModal({ isOpen, onClose, onAddReminder }: SmartReminderModalProps) {
  const [task, setTask] = useState("");
  const [frequency, setFrequency] = useState("once");
  const [smartNudgeEnabled, setSmartNudgeEnabled] = useState(false);
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date();
  const defaultDate = today.toISOString().split('T')[0];
  const defaultTime = today.toTimeString().slice(0, 5); // HH:MM format
  
  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [selectedTime, setSelectedTime] = useState(defaultTime);

  const handleSubmit = () => {
    if (task.trim() && onAddReminder) {
      const newReminder: Reminder = {
        id: `reminder-${Date.now()}`,
        title: task,
        description: smartNudgeEnabled ? "AI-powered reminder" : "Manual reminder",
        time: selectedTime, // Use the selected time
        completed: false,
        isRecurring: frequency !== "once",
        createdAt: Date.now()
      };
      onAddReminder(newReminder);
    }
    onClose();
    setTask("");
    setFrequency("once");
    setSmartNudgeEnabled(false);
    // Reset date and time to defaults
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setSelectedTime(new Date().toTimeString().slice(0, 5));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ 
          background: "rgba(200, 203, 210, 0.2)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)"
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
          className="w-full max-w-xl rounded-3xl border relative overflow-hidden"
          style={{
            background: "rgba(255, 255, 255, 0.7)",
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
            borderColor: "rgba(255, 255, 255, 0.6)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255,255,255,0.8)"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Gradient Top Border */}
          <div 
            className="absolute top-0 left-0 w-full h-2"
            style={{
              background: "linear-gradient(to right, #60A5FA, #A78BFA, #F472B6)",
              opacity: 0.8
            }}
          ></div>

          {/* Background Blobs */}
          <div 
            className="absolute -top-24 -right-24 w-64 h-64 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none"
            style={{ backgroundColor: "#C084FC" }}
          ></div>
          <div 
            className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none"
            style={{ backgroundColor: "#60A5FA" }}
          ></div>

          {/* Modal Content */}
          <div className="p-10 relative z-10">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 
                  className="text-3xl font-bold tracking-tight"
                  style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
                >
                  Set Smart Reminder
                </h2>
                <p className="mt-1 text-sm font-medium tracking-wide" style={{ color: "#6B7280" }}>
                  Never miss a beat. Let KAAL manage your focus.
                </p>
              </div>
              <button 
                className="p-2 rounded-full transition-colors"
                style={{ color: "#6B7280" }}
                onClick={onClose}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.5)";
                  e.currentTarget.style.color = "#111827";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#6B7280";
                }}
              >
                <X className="w-6 h-6" strokeWidth={2} />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-6">
              {/* Task Input */}
              <div className="group relative">
                <input
                  type="text"
                  placeholder="What needs to be done?"
                  className="w-full border-b-2 rounded-t-xl px-4 py-4 text-xl font-medium placeholder-gray-400 transition-all"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.6)",
                    borderColor: "rgba(229, 231, 235, 1)",
                    color: "#111827",
                    outline: "none"
                  }}
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#111827";
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
                    e.currentTarget.style.boxShadow = "0 0 0 4px rgba(255, 255, 255, 0.5), 0 4px 12px rgba(0,0,0,0.05)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(229, 231, 235, 1)";
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.6)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>

              {/* Date and Time */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-2 ml-1" style={{ color: "#6B7280" }}>
                    Date
                  </label>
                  <div className="relative">
                    <Calendar 
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" 
                      style={{ color: "#6B7280" }}
                    />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full border rounded-xl pl-11 pr-4 py-3 text-sm font-semibold transition-all"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.6)",
                        borderColor: "rgba(229, 231, 235, 1)",
                        color: "#111827",
                        outline: "none"
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
                        e.currentTarget.style.borderColor = "#111827";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.6)";
                        e.currentTarget.style.borderColor = "rgba(229, 231, 235, 1)";
                      }}
                    />
                  </div>
                </div>

                <div className="flex-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-2 ml-1" style={{ color: "#6B7280" }}>
                    Time
                  </label>
                  <div className="relative">
                    <Clock 
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" 
                      style={{ color: "#6B7280" }}
                    />
                    <input
                      type="time"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-full border rounded-xl pl-11 pr-4 py-3 text-sm font-semibold transition-all"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.6)",
                        borderColor: "rgba(229, 231, 235, 1)",
                        color: "#111827",
                        outline: "none"
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
                        e.currentTarget.style.borderColor = "#111827";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.6)";
                        e.currentTarget.style.borderColor = "rgba(229, 231, 235, 1)";
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-3 ml-1" style={{ color: "#6B7280" }}>
                  Frequency
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {["once", "daily", "weekly", "custom"].map((freq) => (
                    <button
                      key={freq}
                      className="py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all"
                      style={{
                        backgroundColor: frequency === freq ? "#111827" : "rgba(255, 255, 255, 0.5)",
                        color: frequency === freq ? "#FFFFFF" : "#6B7280",
                        border: frequency === freq ? "none" : "1px solid rgba(229, 231, 235, 1)",
                        boxShadow: frequency === freq ? "0 4px 6px rgba(0, 0, 0, 0.1)" : "none"
                      }}
                      onClick={() => setFrequency(freq)}
                      onMouseEnter={(e) => {
                        if (frequency !== freq) {
                          e.currentTarget.style.borderColor = "rgba(156, 163, 175, 1)";
                          e.currentTarget.style.color = "#111827";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (frequency !== freq) {
                          e.currentTarget.style.borderColor = "rgba(229, 231, 235, 1)";
                          e.currentTarget.style.color = "#6B7280";
                        }
                      }}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>

              {/* Smart Nudge AI */}
              <div 
                className="border rounded-xl p-4 flex items-center justify-between"
                style={{
                  background: "linear-gradient(to bottom right, rgba(238, 242, 255, 1), rgba(243, 232, 255, 1))",
                  borderColor: "rgba(199, 210, 254, 1)"
                }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm"
                    style={{
                      backgroundColor: "#FFFFFF",
                      color: "#6366f1"
                    }}
                  >
                    <Bot className="w-5 h-5" strokeWidth={2} fill="#6366f1" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold" style={{ color: "#111827" }}>
                      Smart Nudge AI
                    </h4>
                    <p className="text-xs leading-tight max-w-[200px]" style={{ color: "#6B7280" }}>
                      Auto-adjusts notification time based on your deep focus patterns.
                    </p>
                  </div>
                </div>
                <div className="relative inline-block w-12 mr-2 align-middle select-none">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={smartNudgeEnabled}
                    onChange={() => setSmartNudgeEnabled(!smartNudgeEnabled)}
                  />
                  <div 
                    className="w-12 h-6 rounded-full cursor-pointer transition-colors duration-300"
                    style={{
                      backgroundColor: smartNudgeEnabled ? "#111827" : "#D1D5DB"
                    }}
                    onClick={() => setSmartNudgeEnabled(!smartNudgeEnabled)}
                  >
                    <div 
                      className="absolute w-6 h-6 rounded-full bg-white border-4 shadow-sm transition-all duration-300 ease-in-out cursor-pointer"
                      style={{
                        borderColor: smartNudgeEnabled ? "#111827" : "#9CA3AF",
                        right: smartNudgeEnabled ? 0 : "auto",
                        left: smartNudgeEnabled ? "auto" : 0
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div 
              className="mt-8 pt-6 flex items-center justify-end gap-4"
              style={{ borderTop: "1px solid rgba(229, 231, 235, 0.5)" }}
            >
              <button 
                className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ color: "#6B7280" }}
                onClick={onClose}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.5)";
                  e.currentTarget.style.color = "#111827";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#6B7280";
                }}
              >
                Cancel
              </button>
              <button 
                className="text-white px-8 py-3 rounded-xl shadow-lg flex items-center gap-2 group transition-all"
                style={{
                  backgroundColor: "#111827",
                  boxShadow: "0 10px 15px -3px rgba(17, 24, 39, 0.2)"
                }}
                onClick={handleSubmit}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.02)";
                  e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(17, 24, 39, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(17, 24, 39, 0.2)";
                }}
              >
                <span className="font-bold tracking-wide text-sm">Schedule Reminder</span>
                <AlarmClock className="w-5 h-5 group-hover:rotate-12 transition-transform" strokeWidth={2} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}