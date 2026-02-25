import { useState } from "react";
import { 
  X, 
  Calendar, 
  FolderOpen, 
  ChevronDown,
  Plus
} from "lucide-react";
import { useTasks } from "../hooks/useTasks";
import { useProjects } from "../hooks/useProjects";
import { Task } from "../services/task-service";

type Priority = "urgent" | "high" | "normal";

interface TaskCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated?: () => void;
}

export function TaskCreationModal({ isOpen, onClose, onTaskCreated }: TaskCreationModalProps) {
  const [taskTitle, setTaskTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("high");
  const [notes, setNotes] = useState("");
  const [autoSchedule, setAutoSchedule] = useState(false);
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  
  const { create } = useTasks();
  const { projects } = useProjects();

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!taskTitle.trim()) return;
    
    // Map modal priority to Task priority
    const taskPriority: Task['priority'] = 
      priority === 'urgent' ? 'urgent' : 
      priority === 'high' ? 'high' : 
      'medium';
    
    await create({
      title: taskTitle,
      description: notes || undefined,
      status: 'todo',
      priority: taskPriority,
      tags: [],
    });
    
    // Reset form
    setTaskTitle("");
    setNotes("");
    setPriority("high");
    setAutoSchedule(false);
    
    if (onTaskCreated) {
      onTaskCreated();
    }
    
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 opacity-0"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        backdropFilter: "blur(4px)",
        animation: "fadeInUp 0.8s ease-out forwards"
      }}
      onClick={onClose}
    >
      {/* Blurred Background Preview */}
      <div 
        className="absolute inset-0 z-0 blur-[6px] opacity-40 scale-105 pointer-events-none select-none overflow-hidden"
      >
        <aside 
          className="w-72 flex flex-col h-full absolute left-0 top-0 bottom-0 border-r border-gray-200"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.5)" }}
        >
          <div className="h-24 flex items-center px-8 border-b" style={{ borderColor: "rgba(255, 255, 255, 0.4)" }}>
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 text-white rounded-lg flex items-center justify-center font-bold text-lg"
                style={{ 
                  backgroundColor: "#111827",
                  fontFamily: "'Playfair Display', serif"
                }}
              >
                K
              </div>
              <span 
                className="text-xl font-bold tracking-tight"
                style={{ 
                  fontFamily: "'Playfair Display', serif",
                  color: "#111827"
                }}
              >
                KAAL
              </span>
            </div>
          </div>
          <div className="p-4 space-y-2">
            <div className="h-10 w-full rounded-xl" style={{ backgroundColor: "rgba(229, 231, 235, 0.5)" }}></div>
            <div className="h-10 w-full rounded-xl" style={{ backgroundColor: "rgba(229, 231, 235, 0.5)" }}></div>
            <div className="h-10 w-full rounded-xl" style={{ backgroundColor: "rgba(229, 231, 235, 0.5)" }}></div>
          </div>
        </aside>
        <main className="ml-72 flex-1 p-10 h-full">
          <div className="h-24 mb-10 border-b" style={{ borderColor: "rgba(229, 231, 235, 0.5)" }}></div>
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-8 h-64 rounded-3xl" style={{ backgroundColor: "rgba(255, 255, 255, 0.4)" }}></div>
            <div className="col-span-4 h-64 rounded-3xl" style={{ backgroundColor: "rgba(255, 255, 255, 0.4)" }}></div>
            <div className="col-span-12 h-96 rounded-3xl" style={{ backgroundColor: "rgba(255, 255, 255, 0.4)" }}></div>
          </div>
        </main>
      </div>

      {/* Modal */}
      <div 
        className="w-full max-w-2xl rounded-[2rem] shadow-2xl border overflow-hidden flex flex-col relative z-10"
        style={{
          background: "rgba(255, 255, 255, 0.55)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderColor: "rgba(255, 255, 255, 0.6)",
          boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.05)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          className="absolute top-6 right-6 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 z-20"
          style={{ 
            backgroundColor: "rgba(255, 255, 255, 0.5)",
            color: "#6B7280"
          }}
          onClick={onClose}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "white";
            e.currentTarget.style.color = "#111827";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.5)";
            e.currentTarget.style.color = "#6B7280";
          }}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="px-10 pt-10 pb-2">
          <div className="flex items-center gap-3 mb-6">
            <span 
              className="px-3 py-1 rounded-full text-white text-[10px] font-bold tracking-widest uppercase"
              style={{ 
                backgroundColor: "#111827",
                boxShadow: "0 0 20px rgba(17, 24, 39, 0.15)"
              }}
            >
              New Entry
            </span>
            <span 
              className="text-xs font-medium flex items-center gap-1"
              style={{ color: "rgba(107, 114, 128, 0.7)" }}
            >
              <Calendar className="w-3.5 h-3.5" />
              Oct 24
            </span>
          </div>

          {/* Title Input */}
          <div className="relative group">
            <input
              type="text"
              autoFocus
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.currentTarget.value)}
              onFocus={() => setIsTitleFocused(true)}
              onBlur={() => setIsTitleFocused(false)}
              className="w-full bg-transparent text-4xl md:text-5xl font-medium tracking-tight border-none focus:ring-0 px-0 py-2 transition-all duration-300"
              style={{
                fontFamily: "'Playfair Display', serif",
                color: "#111827"
              }}
              placeholder="What needs to be done?"
            />
            <div 
              className="h-0.5 bg-gray-100 w-full mt-2 relative overflow-hidden rounded-full"
            >
              <div 
                className="absolute left-0 top-0 bottom-0 transition-all duration-700 ease-out"
                style={{
                  width: isTitleFocused ? "100%" : "0%",
                  backgroundColor: "#111827"
                }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-10 py-6 space-y-8">
          {/* Project Selector */}
          <div 
            className="flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div 
                className="w-10 h-10 rounded-xl border flex items-center justify-center transition-colors"
                style={{ 
                  backgroundColor: "#F9FAFB",
                  borderColor: "#F3F4F6",
                  color: "#9CA3AF"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#111827";
                  e.currentTarget.style.borderColor = "rgba(17, 24, 39, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#9CA3AF";
                  e.currentTarget.style.borderColor = "#F3F4F6";
                }}
              >
                <FolderOpen className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span 
                  className="text-xs font-bold uppercase tracking-wider mb-0.5"
                  style={{ color: "#6B7280" }}
                >
                  Project
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-medium" style={{ color: "#111827" }}>
                    Phoenix UI Design
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-300" />
                </div>
              </div>
            </div>
          </div>

          {/* Priority Level */}
          <div>
            <span 
              className="text-xs font-bold uppercase tracking-wider mb-4 block"
              style={{ color: "#6B7280" }}
            >
              Priority Level
            </span>
            <div className="flex gap-4">
              <PriorityOption
                value="urgent"
                label="Urgent"
                color="#EF4444"
                bgColor="#FEF2F2"
                borderColor="#FECACA"
                textColor="#B91C1C"
                glowColor="rgba(239, 68, 68, 0.4)"
                isSelected={priority === "urgent"}
                onSelect={() => setPriority("urgent")}
              />
              <PriorityOption
                value="high"
                label="High"
                color="#EAB308"
                bgColor="#FEFCE8"
                borderColor="#FEF08A"
                textColor="#A16207"
                glowColor="rgba(234, 179, 8, 0.4)"
                isSelected={priority === "high"}
                onSelect={() => setPriority("high")}
              />
              <PriorityOption
                value="normal"
                label="Normal"
                color="#22C55E"
                bgColor="#F0FDF4"
                borderColor="#BBF7D0"
                textColor="#15803D"
                glowColor="rgba(34, 197, 94, 0.4)"
                isSelected={priority === "normal"}
                onSelect={() => setPriority("normal")}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="relative">
            <span 
              className="text-xs font-bold uppercase tracking-wider mb-2 block"
              style={{ color: "#6B7280" }}
            >
              Notes
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border-none text-sm resize-none p-4 transition-colors focus:ring-1"
              style={{
                backgroundColor: "rgba(249, 250, 251, 0.5)",
                color: "#111827"
              }}
              placeholder="Add context, subtasks, or quick notes..."
              rows={3}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#F9FAFB";
              }}
              onMouseLeave={(e) => {
                if (document.activeElement !== e.currentTarget) {
                  e.currentTarget.style.backgroundColor = "rgba(249, 250, 251, 0.5)";
                }
              }}
              onFocus={(e) => {
                e.currentTarget.style.backgroundColor = "white";
                e.currentTarget.style.borderColor = "#E5E7EB";
              }}
              onBlur={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(249, 250, 251, 0.5)";
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div 
          className="mt-auto border-t px-10 py-6 flex items-center justify-between"
          style={{
            background: "linear-gradient(to right, rgba(255,255,255,0.8), rgba(255,255,255,0.4))",
            backdropFilter: "blur(12px)",
            borderColor: "rgba(255, 255, 255, 0.5)"
          }}
        >
          <div className="flex items-center gap-4">
            {/* Toggle Switch */}
            <div className="relative inline-block w-12 h-7 align-middle select-none">
              <input
                type="checkbox"
                id="ai-toggle"
                checked={autoSchedule}
                onChange={(e) => setAutoSchedule(e.target.checked)}
                className="sr-only"
              />
              <label
                htmlFor="ai-toggle"
                className="block overflow-hidden h-7 rounded-full cursor-pointer transition-colors duration-300"
                style={{
                  backgroundColor: autoSchedule ? "#111827" : "#E5E7EB"
                }}
              >
                <div
                  className="absolute w-5 h-5 rounded-full bg-white border-4 top-1 transition-all duration-300 shadow-sm"
                  style={{
                    left: autoSchedule ? "24px" : "4px",
                    borderColor: autoSchedule ? "#111827" : "#D1D5DB"
                  }}
                />
              </label>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold" style={{ color: "#111827" }}>
                  Auto-Schedule
                </span>
                <span 
                  className="px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wide"
                  style={{
                    backgroundColor: "#F3E8FF",
                    color: "#7C3AED",
                    borderColor: "#E9D5FF"
                  }}
                >
                  AI Beta
                </span>
              </div>
              <p 
                className="text-[10px] max-w-[200px] leading-tight mt-0.5"
                style={{ color: "#6B7280" }}
              >
                KAAL will find the optimal slot in your calendar.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="px-6 py-3 rounded-xl text-sm font-medium transition-all"
              style={{ color: "#6B7280" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#111827";
                e.currentTarget.style.backgroundColor = "#F3F4F6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#6B7280";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              Cancel
            </button>
            <button 
              onClick={handleCreate}
              className="text-white pl-5 pr-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 font-medium group relative overflow-hidden"
              style={{
                backgroundColor: "#111827",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255,255,255,0.1)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#000000";
                e.currentTarget.style.boxShadow = "0 25px 50px -12px rgba(0, 0, 0, 0.25)";
                e.currentTarget.style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#111827";
                e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255,255,255,0.1)";
                e.currentTarget.style.transform = "scale(1)";
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = "scale(0.95)";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = "scale(1.02)";
              }}
            >
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
              />
              <Plus className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Create Task</span>
            </button>
          </div>
        </div>

        {/* Decorative Blurs */}
        <div 
          className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 rounded-full blur-3xl pointer-events-none"
          style={{ background: "linear-gradient(135deg, rgba(219, 234, 254, 0.3), rgba(233, 213, 255, 0.3))" }}
        />
        <div 
          className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 rounded-full blur-3xl pointer-events-none"
          style={{ background: "linear-gradient(45deg, rgba(254, 249, 195, 0.2), rgba(254, 215, 170, 0.2))" }}
        />
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

interface PriorityOptionProps {
  value: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  glowColor: string;
  isSelected: boolean;
  onSelect: () => void;
}

function PriorityOption({ 
  label, 
  color, 
  bgColor, 
  borderColor, 
  textColor, 
  glowColor, 
  isSelected, 
  onSelect 
}: PriorityOptionProps) {
  return (
    <label className="cursor-pointer relative">
      <input
        type="radio"
        className="sr-only peer"
        checked={isSelected}
        onChange={onSelect}
      />
      <div 
        className="px-5 py-3 rounded-xl border transition-all duration-300 flex items-center gap-3 relative overflow-hidden"
        style={{
          backgroundColor: isSelected ? bgColor : "rgba(255, 255, 255, 0.3)",
          borderColor: isSelected ? borderColor : "#E5E7EB"
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.6)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.3)";
          }
        }}
      >
        <div 
          className="w-2 h-2 rounded-full"
          style={{ 
            backgroundColor: color,
            boxShadow: `0 0 20px ${glowColor}`
          }}
        />
        <span 
          className="text-sm font-medium"
          style={{ color: isSelected ? textColor : "#6B7280" }}
        >
          {label}
        </span>
        {isSelected && (
          <div 
            className="absolute inset-0 border-2 rounded-xl scale-100 transition-all"
            style={{ 
              borderColor: color,
              opacity: 0.1
            }}
          />
        )}
      </div>
    </label>
  );
}