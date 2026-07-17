import { useState, useMemo, useEffect } from "react";
import {
  Search, Filter, Plus, Trash2, Clock,
  Edit2, CheckCircle2, Circle, AlertCircle,
  ChevronDown, X, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TaskCreationModal } from "./TaskCreationModal";
import { TaskEditModal } from "./TaskEditModal";
import { useTasks } from "../hooks/useTasks";
import { useProjects } from "../hooks/useProjects";
import { Task } from "../services/task-service";
import { useSettings } from "../context/SettingsContext";
import { toast } from "sonner";
import { ScreenHeader, SCREEN_ANIMATIONS } from "./ui/ScreenHeader";
import { TaskSkeleton } from "./ui/InfiniteScroll";

// ─── Helpers ─────────────────────────────────────────────────────────────────

type StatusFilter = "all" | "todo" | "in-progress" | "completed";

const PRIORITY_ORDER: Record<Task["priority"], number> = {
  urgent: 0, high: 1, medium: 2, low: 3,
};
const PRIORITY_LABEL: Record<Task["priority"], string> = {
  urgent: "Urgent", high: "High", medium: "Medium", low: "Low",
};
const PRIORITY_COLOR: Record<Task["priority"], string> = {
  urgent: "#DC2626", high: "#D97706", medium: "#2563EB", low: "#9CA3AF",
};
const PRIORITY_BG: Record<Task["priority"], string> = {
  urgent: "#FEF2F2", high: "#FFFBEB", medium: "#EFF6FF", low: "#F9FAFB",
};
const PRIORITY_BORDER: Record<Task["priority"], string> = {
  urgent: "#FECACA", high: "#FDE68A", medium: "#DBEAFE", low: "#E5E7EB",
};

function formatDue(dateStr?: string): { text: string; overdue: boolean } {
  if (!dateStr) return { text: "", overdue: false };
  const d = new Date(dateStr);
  const today = new Date(); today.setHours(0, 0, 0, 0); d.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  const overdue = diff < 0;
  let text = "";
  if (diff < 0) text = `${Math.abs(diff)}d overdue`;
  else if (diff === 0) text = "Due today";
  else if (diff === 1) text = "Tomorrow";
  else text = `${diff}d left`;
  return { text, overdue };
}

// ─── Glass constants ──────────────────────────────────────────────────────────

const GLASS: React.CSSProperties = {
  background: "rgba(255,255,255,0.6)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: "1px solid rgba(255,255,255,0.5)",
  boxShadow: "0 4px 20px -4px rgba(0,0,0,0.06)",
};

// ─── Task Card ────────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string, title: string) => void;
  onEdit: (task: Task) => void;
  projects: any[];
}

function TaskCard({ task, onToggle, onDelete, onEdit, projects }: TaskCardProps) {
  const isCompleted = task.status === "completed";
  const project = projects.find(p => p.id === task.projectId);
  const { text: dueText, overdue } = formatDue(task.dueDate);

  return (
    <div
      className="group relative flex items-start gap-4 px-5 py-4 rounded-2xl transition-all duration-200 hover:shadow-md"
      style={{
        ...GLASS,
        opacity: isCompleted ? 0.55 : 1,
      }}
    >
      {/* Left priority bar */}
      <div
        className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
        style={{ backgroundColor: isCompleted ? "#E5E7EB" : PRIORITY_COLOR[task.priority] }}
      />

      {/* Checkbox */}
      <button
        className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
        style={{
          borderColor: isCompleted ? "#059669" : "rgba(0,0,0,0.18)",
          backgroundColor: isCompleted ? "#059669" : "white",
        }}
        onClick={() => onToggle(task.id)}
        title={isCompleted ? "Mark incomplete" : "Mark complete"}
      >
        {isCompleted && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <p
            className="text-sm leading-snug"
            style={{
              color: isCompleted ? "#9CA3AF" : "#111827",
              textDecoration: isCompleted ? "line-through" : "none",
              fontFamily: "'Inter', sans-serif",
              fontWeight: isCompleted ? 400 : 500,
            }}
          >
            {task.title}
          </p>

          {/* Priority badge */}
          {!isCompleted && (
            <span
              className="flex-shrink-0 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border"
              style={{
                color: PRIORITY_COLOR[task.priority],
                backgroundColor: PRIORITY_BG[task.priority],
                borderColor: PRIORITY_BORDER[task.priority],
              }}
            >
              {PRIORITY_LABEL[task.priority]}
            </span>
          )}
        </div>

        {/* Description */}
        {task.description && !isCompleted && (
          <p
            className="text-xs mt-1 line-clamp-1"
            style={{ color: "#9CA3AF" }}
          >
            {task.description}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {project && (
            <span
              className="flex items-center gap-1.5 text-[11px] font-medium"
              style={{ color: "#6B7280" }}
            >
              <span
                className="w-2 h-2 rounded-sm flex-shrink-0"
                style={{ backgroundColor: project.color || "#E5E7EB" }}
              />
              {project.name}
            </span>
          )}
          {task.estimatedMinutes && (
            <span className="flex items-center gap-1 text-[11px]" style={{ color: "#9CA3AF" }}>
              <Clock className="w-3 h-3" />
              {task.estimatedMinutes}m
            </span>
          )}
          {dueText && (
            <span
              className="flex items-center gap-1 text-[11px] font-medium"
              style={{ color: overdue ? "#DC2626" : "#9CA3AF" }}
            >
              {overdue && <AlertCircle className="w-3 h-3" />}
              {dueText}
            </span>
          )}
        </div>
      </div>

      {/* Actions — visible on hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
          style={{ color: "#9CA3AF" }}
          onClick={() => onEdit(task)}
          title="Edit task"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
          style={{ color: "#9CA3AF" }}
          onClick={() => onDelete(task.id, task.title)}
          title="Delete task"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ filter, onAdd }: { filter: StatusFilter; onAdd: () => void }) {
  const msgs: Record<StatusFilter, { icon: string; title: string; sub: string }> = {
    all: { icon: "✓", title: "No tasks yet", sub: "Add your first task to get started." },
    todo: { icon: "📋", title: "Nothing to do", sub: "All tasks are either in progress or done." },
    "in-progress": { icon: "⚡", title: "Nothing in progress", sub: "Mark a task as in-progress to see it here." },
    completed: { icon: "🎉", title: "Nothing completed yet", sub: "Finish your first task and it'll appear here." },
  };
  const { icon, title, sub } = msgs[filter];
  return (
    <div className="text-center py-16">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl"
        style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(0,0,0,0.07)" }}
      >
        {icon}
      </div>
      <p className="text-sm font-medium" style={{ color: "#111827" }}>{title}</p>
      <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>{sub}</p>
      {filter === "all" && (
        <button
          onClick={onAdd}
          className="mt-4 px-5 py-2 rounded-xl text-xs font-medium transition-all hover:shadow-sm"
          style={{ background: "#111827", color: "white" }}
        >
          + New Task
        </button>
      )}
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function TasksScreen() {
  const { settings, updateSettings } = useSettings();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const { tasks, isLoading, toggleComplete, remove } = useTasks({ realtime: true });
  const { projects } = useProjects({ realtime: true });

  // Ensure tasks is always an array (defensive programming)
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  // Filter + sort
  const filtered = useMemo(() => {
    let list = safeTasks.filter(t => t.status !== "archived");

    if (statusFilter !== "all") {
      list = list.filter(t => t.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        t =>
          t.title.toLowerCase().includes(q) ||
          (t.description?.toLowerCase().includes(q)) ||
          (t.tags?.some(tag => tag.toLowerCase().includes(q)))
      );
    }

    // Sort: non-completed by priority, completed at bottom
    return list.sort((a, b) => {
      if (a.status === "completed" && b.status !== "completed") return 1;
      if (a.status !== "completed" && b.status === "completed") return -1;
      return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    });
  }, [safeTasks, statusFilter, searchQuery]);

  const counts = useMemo(() => ({
    all:          safeTasks.filter(t => t.status !== "archived").length,
    todo:         safeTasks.filter(t => t.status === "todo").length,
    "in-progress": safeTasks.filter(t => t.status === "in-progress").length,
    completed:    safeTasks.filter(t => t.status === "completed").length,
  }), [safeTasks]);

  const handleDelete = async (taskId: string, title: string) => {
    toast.error(`Delete "${title}"?`, {
      description: "This action cannot be undone.",
      duration: 6000,
      action: {
        label: "Delete",
        onClick: async () => {
          await remove(taskId);
        },
      },
    });
  };

  const STATUS_TABS: { key: StatusFilter; label: string }[] = [
    { key: "all",          label: "All" },
    { key: "todo",         label: "To Do" },
    { key: "in-progress",  label: "In Progress" },
    { key: "completed",    label: "Completed" },
  ];

  return (
    <div className="flex-1 overflow-y-auto scroll-smooth" style={{ backgroundColor: "#F8F9FA" }}>

      {/* Header */}
      <ScreenHeader
        label="Tasks"
        title="My Workspace"
        actions={
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:shadow-md active:scale-95"
            style={{ background: "#111827", color: "white" }}
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        }
      />

      {/* Content */}
      <div className="px-10 py-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Section title */}
          <div
            className="flex items-end justify-between"
            style={{ animation: "fadeInUp 0.7s ease-out forwards", opacity: 0 }}
          >
            <div>
              <h2
                className="text-4xl font-medium italic"
                style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
              >
                All Tasks
              </h2>
              <p className="mt-1 text-sm" style={{ color: "#9CA3AF" }}>
                {counts.all} tasks · {counts.completed} completed · {counts["in-progress"]} in progress
              </p>
            </div>

            {/* Deep Work toggle */}
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#9CA3AF" }}>
                Deep Work
              </span>
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.deepWorkMode}
                  onChange={() => {
                    updateSettings({ deepWorkMode: !settings.deepWorkMode });
                    toast.success(settings.deepWorkMode ? "Deep Work off" : "Deep Work on");
                  }}
                />
                <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-[#111827] transition-colors duration-200 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
              </div>
              {settings.deepWorkMode && (
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              )}
            </label>
          </div>

          {/* Toolbar: Search + status tabs */}
          <div
            className="flex items-center gap-4"
            style={{ animation: "fadeInUp 0.7s ease-out 0.08s forwards", opacity: 0 }}
          >
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                style={{ color: "#9CA3AF" }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search tasks…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.7)",
                  border: "1px solid rgba(0,0,0,0.08)",
                  color: "#111827",
                }}
                onFocus={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(17,24,39,0.08)"; }}
                onBlur={e => { e.currentTarget.style.background = "rgba(255,255,255,0.7)"; e.currentTarget.style.boxShadow = "none"; }}
              />
              {searchQuery && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="w-3.5 h-3.5" style={{ color: "#9CA3AF" }} />
                </button>
              )}
            </div>

            {/* Status tabs — underline style */}
            <div className="flex items-center gap-1">
              {STATUS_TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className="relative px-4 py-2.5 text-xs font-medium rounded-lg transition-all duration-150"
                  style={{
                    color: statusFilter === tab.key ? "#111827" : "#9CA3AF",
                    background: statusFilter === tab.key ? "rgba(255,255,255,0.8)" : "transparent",
                    border: statusFilter === tab.key ? "1px solid rgba(0,0,0,0.07)" : "1px solid transparent",
                  }}
                >
                  {tab.label}
                  {counts[tab.key] > 0 && (
                    <span
                      className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{
                        background: statusFilter === tab.key ? "#111827" : "rgba(0,0,0,0.07)",
                        color: statusFilter === tab.key ? "white" : "#9CA3AF",
                      }}
                    >
                      {counts[tab.key]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Task list */}
          <div
            className="space-y-2.5"
            style={{ animation: "fadeInUp 0.7s ease-out 0.16s forwards", opacity: 0 }}
          >
            {isLoading ? (
              <div className="space-y-2.5">
                {[1, 2, 3, 4].map(i => (
                  <TaskSkeleton key={i} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState filter={statusFilter} onAdd={() => setIsCreateModalOpen(true)} />
            ) : (
              filtered.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={toggleComplete}
                  onDelete={handleDelete}
                  onEdit={t => { setEditingTask(t); setIsEditModalOpen(true); }}
                  projects={projects}
                />
              ))
            )}
          </div>

          <div className="h-12" />
        </div>
      </div>

      <style>{SCREEN_ANIMATIONS}</style>

      {isCreateModalOpen && (
        <TaskCreationModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onTaskCreated={() => setIsCreateModalOpen(false)}
        />
      )}
      {isEditModalOpen && editingTask && (
        <TaskEditModal
          isOpen={isEditModalOpen}
          onClose={() => { setIsEditModalOpen(false); setEditingTask(null); }}
          onTaskUpdated={() => { setIsEditModalOpen(false); setEditingTask(null); }}
          task={editingTask}
        />
      )}
    </div>
  );
}