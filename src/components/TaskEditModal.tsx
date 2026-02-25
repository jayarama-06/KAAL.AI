import { useState, useEffect } from "react";
import { 
  X, 
  Calendar, 
  FolderOpen, 
  ChevronDown,
  Save
} from "lucide-react";
import { useTasks } from "../hooks/useTasks";
import { useProjects } from "../hooks/useProjects";
import { Task } from "../services/task-service";

interface TaskEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onTaskUpdated?: () => void;
}

export function TaskEditModal({ isOpen, onClose, task, onTaskUpdated }: TaskEditModalProps) {
  const [taskTitle, setTaskTitle] = useState("");
  const [priority, setPriority] = useState<Task['priority']>("medium");
  const [status, setStatus] = useState<Task['status']>("todo");
  const [notes, setNotes] = useState("");
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  
  const { update } = useTasks();
  const { projects } = useProjects();

  // Populate form when task changes
  useEffect(() => {
    if (task) {
      setTaskTitle(task.title);
      setPriority(task.priority);
      setStatus(task.status);
      setNotes(task.description || "");
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleUpdate = async () => {
    if (!taskTitle.trim()) return;
    
    await update(task.id, {
      title: taskTitle,
      description: notes || undefined,
      status: status,
      priority: priority,
    });
    
    if (onTaskUpdated) {
      onTaskUpdated();
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
              Edit Task
            </span>
            <span 
              className="text-xs font-medium flex items-center gap-1"
              style={{ color: "rgba(107, 114, 128, 0.7)" }}
            >
              <Calendar className="w-3.5 h-3.5" />
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
              placeholder="Task title..."
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
          {/* Status Selector */}
          <div>
            <span 
              className="text-xs font-bold uppercase tracking-wider mb-4 block"
              style={{ color: "#6B7280" }}
            >
              Status
            </span>
            <div className="flex gap-3">
              <StatusOption
                value="todo"
                label="To Do"
                color="#6B7280"
                bgColor="#F9FAFB"
                isSelected={status === "todo"}
                onSelect={() => setStatus("todo")}
              />
              <StatusOption
                value="in-progress"
                label="In Progress"
                color="#3B82F6"
                bgColor="#EFF6FF"
                isSelected={status === "in-progress"}
                onSelect={() => setStatus("in-progress")}
              />
              <StatusOption
                value="completed"
                label="Completed"
                color="#22C55E"
                bgColor="#F0FDF4"
                isSelected={status === "completed"}
                onSelect={() => setStatus("completed")}
              />
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
                value="medium"
                label="Medium"
                color="#3B82F6"
                bgColor="#EFF6FF"
                borderColor="#BFDBFE"
                textColor="#1E40AF"
                glowColor="rgba(59, 130, 246, 0.4)"
                isSelected={priority === "medium"}
                onSelect={() => setPriority("medium")}
              />
              <PriorityOption
                value="low"
                label="Low"
                color="#6B7280"
                bgColor="#F9FAFB"
                borderColor="#E5E7EB"
                textColor="#374151"
                glowColor="rgba(107, 114, 128, 0.4)"
                isSelected={priority === "low"}
                onSelect={() => setPriority("low")}
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
          className="mt-auto border-t px-10 py-6 flex items-center justify-end gap-4"
          style={{
            background: "linear-gradient(to right, rgba(255,255,255,0.8), rgba(255,255,255,0.4))",
            backdropFilter: "blur(12px)",
            borderColor: "rgba(255, 255, 255, 0.5)"
          }}
        >
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
            onClick={handleUpdate}
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
            <Save className="w-4 h-4 relative z-10" />
            <span className="relative z-10">Save Changes</span>
          </button>
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

interface StatusOptionProps {
  value: string;
  label: string;
  color: string;
  bgColor: string;
  isSelected: boolean;
  onSelect: () => void;
}

function StatusOption({ label, color, bgColor, isSelected, onSelect }: StatusOptionProps) {
  return (
    <label className="cursor-pointer relative flex-1">
      <input
        type="radio"
        className="sr-only peer"
        checked={isSelected}
        onChange={onSelect}
      />
      <div 
        className="px-4 py-2.5 rounded-xl border transition-all duration-300 flex items-center justify-center gap-2 text-sm font-medium"
        style={{
          backgroundColor: isSelected ? bgColor : "rgba(255, 255, 255, 0.3)",
          borderColor: isSelected ? color : "#E5E7EB",
          color: isSelected ? color : "#6B7280"
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
          style={{ backgroundColor: color }}
        />
        {label}
      </div>
    </label>
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
    <label className="cursor-pointer relative flex-1">
      <input
        type="radio"
        className="sr-only peer"
        checked={isSelected}
        onChange={onSelect}
      />
      <div 
        className="px-4 py-2.5 rounded-xl border transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden"
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
            boxShadow: isSelected ? `0 0 20px ${glowColor}` : 'none'
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
