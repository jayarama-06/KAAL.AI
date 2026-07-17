import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  Brain, Trash2, X, Edit3, Link as LinkIcon, Video, FileText,
  Image as ImageIcon, Upload, Loader2, Sparkles, CheckSquare,
  ListPlus, Clock, Calendar, Zap, ExternalLink,
  Mic, MicOff, Plus, Check, History, Wand2,
  CheckCircle2, XCircle, Pencil, RotateCcw, Layers,
  ArrowRight, Cpu, MessageSquare, ChevronDown,
} from "lucide-react";
import { useProfile } from "../context/ProfileContext";
import { supabase } from "../services/supabase-client";
import { createTask } from "../services/task-service";
import { useNavigate } from "react-router";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface BrainDumpItem {
  id: string;
  type: "text" | "file" | "link" | "image" | "voice";
  content: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  timestamp: Date;
  status: "pending" | "processed" | "error";
}

interface ProcessedTask {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  dueDate?: string;
  category?: string;
  actionStatus: "pending" | "creating" | "created" | "dismissed" | "editing";
  editTitle?: string;
  editPriority?: "low" | "medium" | "high";
  editDueDate?: string;
}

interface ProcessedEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  duration?: number;
  type: "meeting" | "deadline" | "event";
  link?: string;
  actionStatus: "pending" | "created" | "dismissed";
}

interface ProcessedInsight {
  id: string;
  title: string;
  description: string;
  category: string;
}

interface EnhancedResults {
  summary: string;
  tasks: ProcessedTask[];
  events: ProcessedEvent[];
  insights: ProcessedInsight[];
  aiMode: "gemini" | "local";
  processedAt: Date;
}

interface BrainDumpSession {
  id: string;
  timestamp: Date;
  itemCount: number;
  tasksExtracted: number;
  eventsExtracted: number;
  summary: string;
  tags: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const CONTEXT_TAGS = [
  { id: "work", label: "Work", emoji: "\uD83D\uDCBC", color: "#3B82F6" },
  { id: "personal", label: "Personal", emoji: "\uD83C\uDFE0", color: "#10B981" },
  { id: "urgent", label: "Urgent", emoji: "\uD83D\uDD25", color: "#EF4444" },
  { id: "idea", label: "Idea", emoji: "\uD83D\uDCA1", color: "#F59E0B" },
  { id: "meeting", label: "Meeting", emoji: "\uD83D\uDCC5", color: "#8B5CF6" },
  { id: "project", label: "Project", emoji: "\uD83D\uDE80", color: "#6366F1" },
];

const QUICK_TEMPLATES = [
  { label: "Morning Dump", emoji: "\u2600\uFE0F", text: "Today I need to...\nI'm worried about...\nMy top priority is..." },
  { label: "Meeting Notes", emoji: "\uD83D\uDCDD", text: "Meeting with [name] discussed:\nAction items:\nNext steps:" },
  { label: "Project Dump", emoji: "\uD83D\uDE80", text: "Project: [name]\nBlocking issues:\nNext milestone:\nTeam needs:" },
  { label: "End of Day", emoji: "\uD83C\uDF19", text: "Completed today:\nStill pending:\nTomorrow's priorities:" },
];

const PROCESSING_STEPS = [
  "Parsing your brain dump",
  "Extracting actionable tasks",
  "Identifying calendar events",
  "Generating smart insights",
  "Organising results",
];

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL AI PARSER
// ─────────────────────────────────────────────────────────────────────────────

function parseRelativeDate(text: string): string | undefined {
  const lower = text.toLowerCase();
  const today = new Date();

  if (lower.includes("today")) return today.toISOString().split("T")[0];
  if (lower.includes("tomorrow")) {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }
  if (lower.includes("next week")) {
    const d = new Date(today);
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  }
  if (lower.includes("end of week") || lower.includes("this friday")) {
    const d = new Date(today);
    const daysToFriday = (5 - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + daysToFriday);
    return d.toISOString().split("T")[0];
  }
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  for (let i = 0; i < days.length; i++) {
    if (lower.includes(days[i])) {
      const d = new Date(today);
      const diff = (i - d.getDay() + 7) % 7 || 7;
      d.setDate(d.getDate() + diff);
      return d.toISOString().split("T")[0];
    }
  }
  const inDaysMatch = lower.match(/in (\d+) days?/);
  if (inDaysMatch) {
    const d = new Date(today);
    d.setDate(d.getDate() + parseInt(inDaysMatch[1]));
    return d.toISOString().split("T")[0];
  }
  return undefined;
}

function localAIParser(items: BrainDumpItem[]): EnhancedResults {
  const tasks: ProcessedTask[] = [];
  const events: ProcessedEvent[] = [];
  const insights: ProcessedInsight[] = [];
  const seenTitles = new Set<string>();

  const taskPatterns: Array<{ pattern: RegExp; priority: "low" | "medium" | "high" }> = [
    { pattern: /(?:urgently?|asap|immediately):?\s*(.+?)(?:[.;!]|$)/gi, priority: "high" },
    { pattern: /(?:need to|needs to|have to|must)\s+(.+?)(?:[.;!,]|$)/gi, priority: "medium" },
    { pattern: /(?:should|could|want to)\s+(.+?)(?:[.;!,]|$)/gi, priority: "low" },
    { pattern: /(?:todo|to-do|action):\s*(.+?)(?:[.;!]|$)/gi, priority: "medium" },
    { pattern: /(?:don't forget|remember) (?:to\s+)?(.+?)(?:[.;!,]|$)/gi, priority: "medium" },
    { pattern: /(?:finish|complete|fix|update|write|send|review|check|prepare|create|schedule|book|call|email|follow up with|reach out to)\s+(.+?)(?:[.;!,]|$)/gi, priority: "medium" },
  ];

  for (const item of items) {
    if (item.type !== "text" && item.type !== "voice") continue;
    const text = item.content;

    let foundTask = false;
    for (const { pattern, priority: basePriority } of taskPatterns) {
      let match;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(text)) !== null) {
        const raw = match[1].trim().replace(/\s+/g, " ");
        if (raw.length < 3 || raw.length > 150) continue;
        const title = raw.charAt(0).toUpperCase() + raw.slice(1);
        const key = title.toLowerCase();
        if (seenTitles.has(key)) continue;
        seenTitles.add(key);

        const dueDate = parseRelativeDate(text);
        const isHigh = /urgent|asap|immediately|critical|high priority/i.test(text);
        const isLow = /eventually|someday|nice to have|optional|low priority/i.test(text);
        const priority = isHigh ? "high" : isLow ? "low" : basePriority;
        const category =
          /meeting|call|standup|sync/i.test(title) ? "Meetings" :
          /email|message|reply|respond/i.test(title) ? "Communication" :
          /review|read|check/i.test(title) ? "Review" :
          /write|create|prepare|build/i.test(title) ? "Creation" : "General";

        tasks.push({
          id: `task-${Date.now()}-${tasks.length}-${Math.random()}`,
          title,
          description: `Extracted from brain dump: "${text.substring(0, 100)}${text.length > 100 ? "..." : ""}"`,
          priority,
          dueDate,
          category,
          actionStatus: "pending",
        });
        foundTask = true;
      }
    }

    if (!foundTask && text.trim().length > 10) {
      insights.push({
        id: `insight-${Date.now()}-${insights.length}`,
        title: text.length > 80 ? text.substring(0, 80) + "\u2026" : text,
        description: text,
        category: text.includes("?") ? "question" : text.toLowerCase().includes("idea") ? "idea" : "note",
      });
    }
  }

  // Extract meeting links
  for (const item of items) {
    if (item.type === "link") {
      const lt = item.content.includes("zoom.us") ? "zoom"
        : item.content.includes("meet.google.com") ? "meet"
        : item.content.includes("teams.microsoft.com") ? "teams"
        : null;
      if (lt) {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        events.push({
          id: `event-${Date.now()}-${events.length}`,
          title: lt === "zoom" ? "Zoom Meeting" : lt === "meet" ? "Google Meet" : "Teams Meeting",
          date: d.toISOString().split("T")[0],
          time: "10:00",
          duration: 60,
          type: "meeting",
          link: item.content,
          actionStatus: "pending",
        });
      }
    }
  }

  // Extract text-based events (deadlines / meeting references)
  for (const item of items) {
    if (item.type !== "text" && item.type !== "voice") continue;
    const text = item.content;

    const deadlinePattern = /(.+?)\s+(?:due|deadline|by)\s+(.+?)(?:[.;!,]|$)/gi;
    let match;
    while ((match = deadlinePattern.exec(text)) !== null) {
      const dueDate = parseRelativeDate(match[2]);
      if (!dueDate) continue;
      events.push({
        id: `event-${Date.now()}-${events.length}-dl`,
        title: `Deadline: ${match[1].trim()}`,
        date: dueDate,
        type: "deadline",
        actionStatus: "pending",
      });
    }
  }

  // If still no tasks, convert all text items to insights
  if (tasks.length === 0 && insights.length === 0) {
    for (const item of items) {
      if ((item.type === "text" || item.type === "voice") && item.content.trim().length > 10) {
        insights.push({
          id: `insight-fb-${Date.now()}-${insights.length}`,
          title: item.content.length > 80 ? item.content.substring(0, 80) + "\u2026" : item.content,
          description: item.content,
          category: "note",
        });
      }
    }
  }

  const tw = tasks.length === 1 ? "task" : "tasks";
  const ew = events.length === 1 ? "event" : "events";
  const summary = tasks.length > 0 || events.length > 0
    ? `Local analysis found ${tasks.length} ${tw}${events.length > 0 ? ` and ${events.length} ${ew}` : ""}. Review and create them to add to your workflow.`
    : insights.length > 0
    ? `Captured ${insights.length} insight${insights.length === 1 ? "" : "s"}. Try adding phrases like "I need to..." or "Meeting tomorrow at 2pm" to extract tasks.`
    : "Brain dump captured. Add more context to extract tasks and events automatically.";

  return {
    summary,
    tasks: tasks.slice(0, 12),
    events: events.slice(0, 6),
    insights: insights.slice(0, 8),
    aiMode: "local",
    processedAt: new Date(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function CreativeCanvasScreen({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<BrainDumpItem[]>([]);
  const [textInput, setTextInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [results, setResults] = useState<EnhancedResults | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceInterim, setVoiceInterim] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"dump" | "history">("dump");
  const [history, setHistory] = useState<BrainDumpSession[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { profile } = useProfile();
  const navigate = useNavigate();

  // Load history
  useEffect(() => {
    try {
      const saved = localStorage.getItem("kaal_brain_dump_history");
      if (saved) {
        const parsed = JSON.parse(saved).map((s: any) => ({ ...s, timestamp: new Date(s.timestamp) }));
        setHistory(parsed);
      }
    } catch { /* ignore */ }
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // ── Voice ──────────────────────────────────────────────────────────────────

  const SR = typeof window !== "undefined"
    ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    : null;

  const toggleVoice = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    if (!SR) {
      toast.error("Voice input not supported", { description: "Try Chrome or Edge" });
      return;
    }
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (e: any) => {
      let final = "";
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        (e.results[i].isFinal ? (final += e.results[i][0].transcript) : (interim += e.results[i][0].transcript));
      }
      if (final) setTextInput(prev => prev + (prev ? " " : "") + final.trim());
      setVoiceInterim(interim);
    };
    recognition.onend = () => { setIsRecording(false); setVoiceInterim(""); };
    recognition.onerror = (e: any) => {
      setIsRecording(false);
      if (e.error !== "no-speech") toast.error("Voice error", { description: e.error });
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    toast.success("Listening\u2026", { description: "Speak your thoughts freely" });
  };

  // ── Add items ─────────────────────────────────────────────────────────────

  const handleAdd = () => {
    if (!textInput.trim()) return;
    const links = textInput.match(/(https?:\/\/[^\s]+)/g);
    if (links) {
      links.forEach(link => {
        setItems(prev => [...prev, { id: `link-${Date.now()}-${Math.random()}`, type: "link", content: link, timestamp: new Date(), status: "pending" }]);
      });
      const rest = textInput.replace(/(https?:\/\/[^\s]+)/g, "").trim();
      if (rest) setItems(prev => [...prev, { id: `text-${Date.now()}`, type: "text", content: rest, timestamp: new Date(), status: "pending" }]);
    } else {
      setItems(prev => [...prev, { id: `text-${Date.now()}`, type: "text", content: textInput, timestamp: new Date(), status: "pending" }]);
    }
    setTextInput("");
    textareaRef.current?.focus();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        setItems(prev => [...prev, {
          id: `file-${Date.now()}-${Math.random()}`,
          type: file.type.startsWith("image/") ? "image" : "file",
          content,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          timestamp: new Date(),
          status: "pending",
        }]);
        toast.success(`Added: ${file.name}`);
      };
      file.type.startsWith("image/") ? reader.readAsDataURL(file) : reader.readAsText(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── AI Processing ─────────────────────────────────────────────────────────

  const buildPrompt = () => {
    const name = profile.fullName || profile.name || "User";
    let prompt = `You are KAAL, an executive function AI. Analyze this brain dump and extract actionable items.\nUSER: ${name} | DATE: ${new Date().toLocaleDateString()} | TAGS: ${selectedTags.join(", ") || "none"}\nBRAIN DUMP:\n`;
    items.forEach((item, i) => {
      prompt += `\n${i + 1}. [${item.type.toUpperCase()}] `;
      if (item.type === "text" || item.type === "voice") prompt += item.content;
      else if (item.type === "link") {
        const lt = item.content.includes("zoom.us") ? "ZOOM" : item.content.includes("meet.google.com") ? "MEET" : item.content.includes("teams.microsoft.com") ? "TEAMS" : "URL";
        prompt += `${lt}: ${item.content}`;
      } else if (item.type === "file" || item.type === "image") {
        prompt += `FILE: ${item.fileName}`;
        if (item.fileType === "text/plain") prompt += `\nContent: ${item.content.substring(0, 500)}`;
      }
    });
    prompt += `\n\nReturn ONLY valid JSON:\n{\n  "tasks": [{"title":"","description":"","priority":"high|medium|low","dueDate":"YYYY-MM-DD","category":""}],\n  "events": [{"title":"","date":"YYYY-MM-DD","time":"HH:MM","duration":60,"type":"meeting|deadline|event","link":""}],\n  "insights": [{"title":"","description":"","category":"idea|note|question|reference|decision"}],\n  "summary": ""\n}\nRules: Extract tasks from "need to X" -> Task "X". Parse relative dates from today ${new Date().toISOString().split("T")[0]}. Zoom/Meet links -> meeting events.`;
    return prompt;
  };

  const processWithAI = async () => {
    if (items.length === 0) {
      toast.error("Nothing to process", { description: "Add text, files, or links first" });
      return;
    }
    setIsProcessing(true);
    setProcessingStep(1);

    const stepTimer = setInterval(() => {
      setProcessingStep(prev => (prev < PROCESSING_STEPS.length ? prev + 1 : prev));
    }, 700);

    let enhancedResults: EnhancedResults | null = null;

    try {
      // Try Gemini AI via Edge Function
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        try {
          const { data, error } = await supabase.functions.invoke("gemini-proxy", { body: { prompt: buildPrompt() } });
          if (!error && data?.success && data?.response) {
            const jsonMatch = data.response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const raw = JSON.parse(jsonMatch[0]);
              enhancedResults = {
                summary: raw.summary || "",
                tasks: (raw.tasks || []).map((t: any, i: number) => ({ id: `ai-t-${i}-${Date.now()}`, ...t, actionStatus: "pending" as const })),
                events: (raw.events || []).map((e: any, i: number) => ({ id: `ai-e-${i}-${Date.now()}`, ...e, actionStatus: "pending" as const })),
                insights: (raw.insights || []).map((ins: any, i: number) => ({ id: `ai-ins-${i}-${Date.now()}`, ...ins })),
                aiMode: "gemini" as const,
                processedAt: new Date(),
              };
            }
          }
        } catch { /* fall through to local */ }
      }
    } catch { /* fall through */ }

    clearInterval(stepTimer);
    setProcessingStep(PROCESSING_STEPS.length);

    // Fallback to local parser
    if (!enhancedResults) {
      enhancedResults = localAIParser(items);
    }

    setItems(prev => prev.map(it => ({ ...it, status: "processed" as const })));
    setResults(enhancedResults);

    // Save history
    const session: BrainDumpSession = {
      id: `s-${Date.now()}`,
      timestamp: new Date(),
      itemCount: items.length,
      tasksExtracted: enhancedResults.tasks.length,
      eventsExtracted: enhancedResults.events.length,
      summary: enhancedResults.summary,
      tags: selectedTags,
    };
    const newHistory = [session, ...history].slice(0, 10);
    setHistory(newHistory);
    try { localStorage.setItem("kaal_brain_dump_history", JSON.stringify(newHistory)); } catch { /* ignore */ }

    const modeIcon = enhancedResults.aiMode === "gemini" ? "\u2728" : "\uD83E\uDDE0";
    toast.success(`${modeIcon} Analysis Complete!`, {
      description: `${enhancedResults.tasks.length} tasks \u00B7 ${enhancedResults.events.length} events \u00B7 ${enhancedResults.insights.length} insights`,
    });

    setIsProcessing(false);
    setProcessingStep(0);
  };

  // ── Task actions ──────────────────────────────────────────────────────────

  const createOne = async (taskId: string) => {
    if (!results) return;
    const task = results.tasks.find(t => t.id === taskId);
    if (!task) return;
    setResults(prev => prev ? { ...prev, tasks: prev.tasks.map(t => t.id === taskId ? { ...t, actionStatus: "creating" } : t) } : null);

    const title = task.editTitle || task.title;
    const priority = (task.editPriority || task.priority) as "low" | "medium" | "high";
    const dueDate = task.editDueDate || task.dueDate;

    const result = await createTask({ title, description: task.description, priority, dueDate, status: "todo", tags: selectedTags.length ? selectedTags : undefined });
    if (result.success) {
      setResults(prev => prev ? { ...prev, tasks: prev.tasks.map(t => t.id === taskId ? { ...t, actionStatus: "created" } : t) } : null);
      toast.success(`\u2713 Created: "${title}"`);
    } else {
      setResults(prev => prev ? { ...prev, tasks: prev.tasks.map(t => t.id === taskId ? { ...t, actionStatus: "pending" } : t) } : null);
      toast.error("Failed to create task", { description: result.error });
    }
  };

  const startEdit = (taskId: string) => {
    setResults(prev => prev ? { ...prev, tasks: prev.tasks.map(t => t.id === taskId ? { ...t, actionStatus: "editing", editTitle: t.editTitle || t.title, editPriority: t.editPriority || t.priority, editDueDate: t.editDueDate || t.dueDate } : t) } : null);
  };

  const cancelEdit = (taskId: string) => {
    setResults(prev => prev ? { ...prev, tasks: prev.tasks.map(t => t.id === taskId ? { ...t, actionStatus: "pending" } : t) } : null);
  };

  const dismiss = (taskId: string) => {
    setResults(prev => prev ? { ...prev, tasks: prev.tasks.map(t => t.id === taskId ? { ...t, actionStatus: "dismissed" } : t) } : null);
  };

  const createAllPending = async () => {
    if (!results) return;
    const pending = results.tasks.filter(t => t.actionStatus === "pending");
    for (const t of pending) await createOne(t.id);
    toast.success(`Created ${pending.length} tasks!`, {
      description: "View your task list",
      action: { label: "Go to Tasks", onClick: () => { navigate("/tasks"); onClose(); } },
    });
  };

  const clearAll = () => {
    setItems([]);
    setResults(null);
    setTextInput("");
    setSelectedTags([]);
    toast.success("Canvas cleared");
  };

  const toggleTag = (id: string) => setSelectedTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);

  const detectLinkType = (url: string) => url.includes("zoom.us") ? "zoom" : url.includes("meet.google.com") ? "meet" : url.includes("teams.microsoft.com") ? "teams" : "generic";

  const formatBytes = (b: number) => b < 1024 ? `${b}B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(1)}KB` : `${(b / (1024 * 1024)).toFixed(1)}MB`;

  const pendingCount = results?.tasks.filter(t => t.actionStatus === "pending").length ?? 0;
  const createdCount = results?.tasks.filter(t => t.actionStatus === "created").length ?? 0;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "rgba(248,249,250,0.97)", backdropFilter: "blur(40px) saturate(180%)", WebkitBackdropFilter: "blur(40px) saturate(180%)" }}
    >
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between px-8 py-4 border-b shrink-0"
        style={{ borderColor: "rgba(0,0,0,0.07)", background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
      >
        {/* Title */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ background: "linear-gradient(135deg, #667EEA, #764BA2)" }}>
            <Brain className="w-5 h-5" strokeWidth={2} />
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#9CA3AF" }}>KAAL Creative Canvas</p>
            <p className="text-xl italic" style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}>AI Brain Dump</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-gray-100/80 rounded-xl p-1 backdrop-blur-sm">
          {([{ id: "dump", label: "Dump", icon: Brain }, { id: "history", label: "History", icon: History }] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
              style={{ backgroundColor: activeTab === tab.id ? "white" : "transparent", color: activeTab === tab.id ? "#111827" : "#6B7280", boxShadow: activeTab === tab.id ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.id === "history" && history.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-gray-200 rounded-full text-[9px] font-bold">{history.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button onClick={clearAll} className="px-3 py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all hover:bg-red-50" style={{ borderColor: "rgba(239,68,68,0.3)", color: "#EF4444" }}>
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          )}
          <button onClick={onClose} className="p-2.5 rounded-full hover:bg-gray-100 transition-colors" style={{ color: "#6B7280" }}>
            <X className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-hidden p-6 min-h-0">
        <AnimatePresence mode="wait">

          {/* ── DUMP TAB ── */}
          {activeTab === "dump" && (
            <motion.div
              key="dump"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex gap-5 min-h-0"
            >
              {/* LEFT — Input */}
              <div className="w-[37%] flex flex-col gap-3 min-h-0">
                {/* Textarea card */}
                <div
                  className="flex-1 rounded-2xl p-5 border flex flex-col min-h-0"
                  style={{ background: "rgba(255,255,255,0.85)", borderColor: isRecording ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)", boxShadow: isRecording ? "0 0 0 2px rgba(239,68,68,0.15), 0 10px 30px -10px rgba(0,0,0,0.08)" : "0 10px 30px -10px rgba(0,0,0,0.08)" }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base italic" style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}>
                      Dump your thoughts&hellip;
                    </h3>
                    {/* Voice button */}
                    <button
                      onClick={toggleVoice}
                      className="p-2 rounded-xl transition-all flex-shrink-0 relative"
                      style={{ backgroundColor: isRecording ? "#EF4444" : "rgba(102,126,234,0.1)", color: isRecording ? "white" : "#667EEA" }}
                      title={isRecording ? "Stop voice" : "Start voice input"}
                    >
                      {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      {isRecording && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-400 rounded-full animate-ping" />}
                    </button>
                  </div>

                  {/* Recording indicator */}
                  {isRecording && (
                    <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-red-50 rounded-xl border border-red-100">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs font-medium text-red-600">Recording&hellip;</span>
                      {voiceInterim && <span className="text-xs text-red-400 italic truncate">{voiceInterim}</span>}
                    </div>
                  )}

                  <textarea
                    ref={textareaRef}
                    autoFocus
                    value={textInput}
                    onChange={e => setTextInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAdd(); }}
                    className="flex-1 w-full text-sm font-light leading-relaxed resize-none bg-transparent border-none outline-none"
                    style={{ color: "#111827", minHeight: "100px" }}
                    placeholder={"Type anything...\n\n\u2022 \"Need to email Sarah by tomorrow\"\n\u2022 \"Team standup at 3pm Monday\"\n\u2022 Paste a Zoom/Meet/Teams link\n\n\u2318+Enter to add item"}
                  />

                  <div className="mt-3 pt-3 border-t flex gap-2" style={{ borderColor: "#F3F4F6" }}>
                    <button
                      onClick={handleAdd}
                      disabled={!textInput.trim()}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ backgroundColor: textInput.trim() ? "#111827" : "#E5E7EB", color: textInput.trim() ? "white" : "#9CA3AF" }}
                    >
                      <Plus className="w-4 h-4" /> Add Item
                    </button>

                    {/* Templates */}
                    <div className="relative">
                      <button
                        onClick={() => setShowTemplates(s => !s)}
                        className="px-3 py-2.5 rounded-xl border text-sm font-medium transition-all hover:bg-gray-50"
                        style={{ borderColor: "#E5E7EB", color: "#6B7280" }}
                        title="Quick templates"
                      >
                        <Layers className="w-4 h-4" />
                      </button>
                      <AnimatePresence>
                        {showTemplates && (
                          <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            className="absolute bottom-full mb-2 right-0 w-52 rounded-2xl border p-2 shadow-xl z-20"
                            style={{ background: "white", borderColor: "#E5E7EB" }}
                          >
                            {QUICK_TEMPLATES.map(t => (
                              <button
                                key={t.label}
                                onClick={() => { setTextInput(t.text); setShowTemplates(false); textareaRef.current?.focus(); toast.success(`Template: ${t.label}`); }}
                                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
                              >
                                <span>{t.emoji}</span>
                                <span className="text-xs font-medium" style={{ color: "#111827" }}>{t.label}</span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Context Tags */}
                <div className="rounded-2xl p-4 border" style={{ background: "rgba(255,255,255,0.75)", borderColor: "rgba(255,255,255,0.9)" }}>
                  <p className="text-[10px] font-bold tracking-widest uppercase mb-2.5" style={{ color: "#9CA3AF" }}>Context Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {CONTEXT_TAGS.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className="px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all"
                        style={{ backgroundColor: selectedTags.includes(tag.id) ? tag.color : "transparent", borderColor: selectedTags.includes(tag.id) ? tag.color : "#E5E7EB", color: selectedTags.includes(tag.id) ? "white" : "#6B7280" }}
                      >
                        {tag.emoji} {tag.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* File Upload */}
                <div className="rounded-2xl border" style={{ background: "rgba(255,255,255,0.75)", borderColor: "rgba(255,255,255,0.9)" }}>
                  <input ref={fileInputRef} type="file" multiple accept=".pdf,.txt,.doc,.docx,image/*" onChange={handleFileUpload} className="hidden" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 px-4 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed text-xs font-medium transition-all"
                    style={{ borderColor: "rgba(102,126,234,0.3)", color: "#667EEA", backgroundColor: "rgba(102,126,234,0.04)" }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(102,126,234,0.1)"; e.currentTarget.style.borderColor = "#667EEA"; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = "rgba(102,126,234,0.04)"; e.currentTarget.style.borderColor = "rgba(102,126,234,0.3)"; }}
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload PDF, Image, or Text File
                  </button>
                </div>

                {/* Process Button */}
                <button
                  onClick={processWithAI}
                  disabled={items.length === 0 || isProcessing}
                  className="py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                  style={{ background: items.length > 0 && !isProcessing ? "linear-gradient(135deg, #667EEA, #764BA2)" : "#E5E7EB", color: items.length > 0 && !isProcessing ? "white" : "#9CA3AF" }}
                >
                  {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Analysing&hellip;</> : <><Wand2 className="w-5 h-5" /> Process with AI{items.length > 0 ? ` (${items.length})` : ""}</>}
                </button>
              </div>

              {/* MIDDLE — Items Queue */}
              <div className="w-[22%] flex flex-col gap-3 min-h-0">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#9CA3AF" }}>
                    Queued ({items.length})
                  </p>
                  {items.length > 0 && (
                    <button onClick={() => { setItems([]); setResults(null); }} className="text-[10px] font-medium hover:text-red-500 transition-colors" style={{ color: "#9CA3AF" }}>
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0" style={{ scrollbarWidth: "thin", scrollbarColor: "#E5E7EB transparent" }}>
                  <AnimatePresence>
                    {items.length === 0 ? (
                      <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-2xl h-64" style={{ borderColor: "rgba(229,231,235,0.6)", color: "#D1D5DB" }}>
                        <MessageSquare className="w-10 h-10 mb-3 opacity-40" />
                        <p className="text-xs font-medium">Nothing yet</p>
                        <p className="text-[10px] mt-1 opacity-70">Type + ⌘Enter to add</p>
                      </div>
                    ) : (
                      items.map((item, idx) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: idx * 0.025 }}
                          className="p-3 rounded-xl border group relative"
                          style={{ background: "rgba(255,255,255,0.85)", borderColor: item.status === "processed" ? "rgba(16,185,129,0.3)" : "rgba(229,231,235,0.6)" }}
                        >
                          <div className="flex gap-2 items-start">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{
                                backgroundColor: item.type === "text" || item.type === "voice" ? "#F3F4F6" : item.type === "link" ? "#EEF2FF" : item.type === "image" ? "#FEF3C7" : "#DBEAFE",
                                color: item.type === "text" || item.type === "voice" ? "#6B7280" : item.type === "link" ? "#667EEA" : item.type === "image" ? "#F59E0B" : "#3B82F6",
                              }}
                            >
                              {item.type === "text" && <Edit3 className="w-3 h-3" />}
                              {item.type === "voice" && <Mic className="w-3 h-3" />}
                              {item.type === "link" && (detectLinkType(item.content) !== "generic" ? <Video className="w-3 h-3" /> : <LinkIcon className="w-3 h-3" />)}
                              {item.type === "image" && <ImageIcon className="w-3 h-3" />}
                              {item.type === "file" && <FileText className="w-3 h-3" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: "#374151" }}>
                                {(item.type === "file" || item.type === "image") ? item.fileName : item.content.length > 70 ? item.content.substring(0, 70) + "\u2026" : item.content}
                              </p>
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-[9px]" style={{ color: "#9CA3AF" }}>
                                  {item.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </p>
                                {item.status === "processed" && <span className="text-[9px] text-green-600 font-bold">\u2713</span>}
                              </div>
                            </div>
                            <button onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))} className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-50 transition-all" style={{ color: "#EF4444" }}>
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* RIGHT — Results */}
              <div className="flex-1 flex flex-col gap-3 min-h-0 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#9CA3AF" }}>AI Results</p>
                  {results && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ backgroundColor: results.aiMode === "gemini" ? "rgba(102,126,234,0.1)" : "rgba(16,185,129,0.1)", color: results.aiMode === "gemini" ? "#667EEA" : "#059669" }}>
                      {results.aiMode === "gemini" ? <Sparkles className="w-3 h-3" /> : <Cpu className="w-3 h-3" />}
                      {results.aiMode === "gemini" ? "Gemini AI" : "Local Parser"}
                    </span>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0" style={{ scrollbarWidth: "thin", scrollbarColor: "#E5E7EB transparent" }}>
                  {/* Processing steps */}
                  {isProcessing && (
                    <div className="p-6 rounded-2xl border" style={{ background: "rgba(255,255,255,0.85)", borderColor: "#E5E7EB" }}>
                      <div className="flex items-center gap-3 mb-5">
                        <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#667EEA" }} />
                        <p className="text-sm font-medium" style={{ color: "#111827" }}>Analysing your brain dump&hellip;</p>
                      </div>
                      <div className="space-y-3">
                        {PROCESSING_STEPS.map((step, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500"
                              style={{ backgroundColor: processingStep > i ? "#667EEA" : processingStep === i ? "rgba(102,126,234,0.15)" : "rgba(229,231,235,0.5)", color: processingStep > i ? "white" : processingStep === i ? "#667EEA" : "#D1D5DB" }}
                            >
                              {processingStep > i ? <Check className="w-3 h-3" /> : processingStep === i ? <div className="w-2 h-2 rounded-full bg-current animate-pulse" /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                            </div>
                            <p className="text-xs transition-all" style={{ color: processingStep > i ? "#059669" : processingStep === i ? "#111827" : "#9CA3AF", fontWeight: processingStep === i ? 600 : 400 }}>
                              {step}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty */}
                  {!results && !isProcessing && (
                    <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-2xl h-80" style={{ borderColor: "rgba(229,231,235,0.5)", color: "#D1D5DB" }}>
                      <Sparkles className="w-14 h-14 mb-4 opacity-30" />
                      <p className="text-sm font-medium mb-1 opacity-60">Waiting for analysis</p>
                      <p className="text-xs opacity-40 max-w-40">Add items then click &ldquo;Process with AI&rdquo;</p>
                    </div>
                  )}

                  {/* Results */}
                  {results && !isProcessing && (
                    <>
                      {/* Summary */}
                      <div className="p-4 rounded-2xl border" style={{ background: "linear-gradient(135deg, rgba(102,126,234,0.06), rgba(118,75,162,0.04))", borderColor: "rgba(102,126,234,0.2)" }}>
                        <p className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: "#667EEA" }}>\u2728 Summary</p>
                        <p className="text-xs leading-relaxed" style={{ color: "#374151" }}>{results.summary}</p>
                      </div>

                      {/* Tasks */}
                      {results.tasks.length > 0 && (
                        <div className="rounded-2xl border overflow-hidden" style={{ background: "rgba(255,255,255,0.85)", borderColor: "#E5E7EB" }}>
                          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "#F3F4F6" }}>
                            <h4 className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "#6B7280" }}>
                              <CheckSquare className="w-3.5 h-3.5" />
                              Tasks ({results.tasks.filter(t => t.actionStatus !== "dismissed").length})
                              {createdCount > 0 && <span className="text-green-600">&middot; {createdCount} created</span>}
                            </h4>
                            {pendingCount > 0 && (
                              <button onClick={createAllPending} className="text-[10px] px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all hover:opacity-90" style={{ backgroundColor: "#111827", color: "white" }}>
                                <ListPlus className="w-3 h-3" /> Create All ({pendingCount})
                              </button>
                            )}
                            {createdCount > 0 && pendingCount === 0 && (
                              <button onClick={() => { navigate("/tasks"); onClose(); }} className="text-[10px] px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1" style={{ backgroundColor: "#10B981", color: "white" }}>
                                <ArrowRight className="w-3 h-3" /> View Tasks
                              </button>
                            )}
                          </div>

                          <div className="divide-y divide-gray-50">
                            {results.tasks.map(task => (
                              <AnimatePresence key={task.id}>
                                {task.actionStatus !== "dismissed" && (
                                  <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="px-4 py-3"
                                    style={{ backgroundColor: task.actionStatus === "created" ? "rgba(16,185,129,0.03)" : "transparent" }}
                                  >
                                    {task.actionStatus === "editing" ? (
                                      <div className="space-y-2">
                                        <input
                                          type="text"
                                          value={task.editTitle ?? task.title}
                                          onChange={e => setResults(prev => prev ? { ...prev, tasks: prev.tasks.map(t => t.id === task.id ? { ...t, editTitle: e.target.value } : t) } : null)}
                                          className="w-full text-sm font-medium px-3 py-2 rounded-lg border outline-none"
                                          style={{ borderColor: "#E5E7EB", color: "#111827" }}
                                        />
                                        <div className="flex gap-2">
                                          <select
                                            value={task.editPriority ?? task.priority}
                                            onChange={e => setResults(prev => prev ? { ...prev, tasks: prev.tasks.map(t => t.id === task.id ? { ...t, editPriority: e.target.value as any } : t) } : null)}
                                            className="flex-1 text-xs px-2 py-1.5 rounded-lg border outline-none"
                                            style={{ borderColor: "#E5E7EB", color: "#6B7280" }}
                                          >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                          </select>
                                          <input
                                            type="date"
                                            value={task.editDueDate ?? task.dueDate ?? ""}
                                            onChange={e => setResults(prev => prev ? { ...prev, tasks: prev.tasks.map(t => t.id === task.id ? { ...t, editDueDate: e.target.value } : t) } : null)}
                                            className="flex-1 text-xs px-2 py-1.5 rounded-lg border outline-none"
                                            style={{ borderColor: "#E5E7EB", color: "#6B7280" }}
                                          />
                                        </div>
                                        <div className="flex gap-2">
                                          <button onClick={() => createOne(task.id)} className="flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 text-white" style={{ backgroundColor: "#111827" }}>
                                            <Check className="w-3 h-3" /> Save &amp; Create
                                          </button>
                                          <button onClick={() => cancelEdit(task.id)} className="px-3 py-1.5 rounded-lg text-xs border hover:bg-gray-50" style={{ borderColor: "#E5E7EB", color: "#6B7280" }}>
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-start gap-2">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <p className={`text-xs font-medium ${task.actionStatus === "created" ? "line-through opacity-40" : ""}`} style={{ color: "#111827" }}>
                                              {task.editTitle ?? task.title}
                                            </p>
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 ${(task.editPriority ?? task.priority) === "high" ? "bg-red-50 text-red-600 border border-red-100" : (task.editPriority ?? task.priority) === "medium" ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-gray-100 text-gray-500"}`}>
                                              {task.editPriority ?? task.priority}
                                            </span>
                                          </div>
                                          {(task.editDueDate ?? task.dueDate) && (
                                            <p className="text-[10px] flex items-center gap-1 mt-0.5" style={{ color: "#9CA3AF" }}>
                                              <Clock className="w-2.5 h-2.5" />
                                              {new Date(task.editDueDate ?? task.dueDate!).toLocaleDateString()}
                                            </p>
                                          )}
                                          {task.category && task.category !== "General" && (
                                            <span className="text-[9px] mt-0.5 inline-block px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{task.category}</span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-0.5 flex-shrink-0">
                                          {task.actionStatus === "created" ? (
                                            <span className="text-[10px] text-green-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Done</span>
                                          ) : task.actionStatus === "creating" ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                                          ) : (
                                            <>
                                              <button onClick={() => createOne(task.id)} className="p-1.5 rounded-lg hover:bg-green-50 transition-colors" style={{ color: "#10B981" }} title="Create task"><Check className="w-3.5 h-3.5" /></button>
                                              <button onClick={() => startEdit(task.id)} className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors" style={{ color: "#3B82F6" }} title="Edit"><Pencil className="w-3 h-3" /></button>
                                              <button onClick={() => dismiss(task.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" style={{ color: "#EF4444" }} title="Dismiss"><XCircle className="w-3 h-3" /></button>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Events */}
                      {results.events.filter(e => e.actionStatus !== "dismissed").length > 0 && (
                        <div className="rounded-2xl border overflow-hidden" style={{ background: "rgba(255,255,255,0.85)", borderColor: "#E5E7EB" }}>
                          <div className="px-4 py-3 border-b" style={{ borderColor: "#F3F4F6" }}>
                            <h4 className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "#6B7280" }}>
                              <Calendar className="w-3.5 h-3.5" /> Events ({results.events.filter(e => e.actionStatus !== "dismissed").length})
                            </h4>
                          </div>
                          <div className="divide-y divide-gray-50">
                            {results.events.filter(e => e.actionStatus !== "dismissed").map(ev => (
                              <div key={ev.id} className="px-4 py-3 flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className="text-xs font-medium" style={{ color: "#111827" }}>{ev.title}</p>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 ${ev.type === "meeting" ? "bg-blue-50 text-blue-600" : ev.type === "deadline" ? "bg-red-50 text-red-600" : "bg-purple-50 text-purple-600"}`}>
                                      {ev.type}
                                    </span>
                                  </div>
                                  <p className="text-[10px] flex items-center gap-1 mt-0.5" style={{ color: "#9CA3AF" }}>
                                    <Calendar className="w-2.5 h-2.5" />
                                    {new Date(ev.date).toLocaleDateString()}{ev.time && ` \u00B7 ${ev.time}`}{ev.duration && ` \u00B7 ${ev.duration}min`}
                                  </p>
                                  {ev.link && (
                                    <a href={ev.link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 mt-1">
                                      <Video className="w-2.5 h-2.5" /> Join <ExternalLink className="w-2 h-2" />
                                    </a>
                                  )}
                                </div>
                                <button onClick={() => setResults(prev => prev ? { ...prev, events: prev.events.map(e => e.id === ev.id ? { ...e, actionStatus: "dismissed" } : e) } : null)} className="p-1 rounded hover:bg-red-50 transition-colors flex-shrink-0" style={{ color: "#EF4444" }}>
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Insights */}
                      {results.insights.length > 0 && (
                        <div className="rounded-2xl border overflow-hidden" style={{ background: "rgba(255,255,255,0.85)", borderColor: "#E5E7EB" }}>
                          <div className="px-4 py-3 border-b" style={{ borderColor: "#F3F4F6" }}>
                            <h4 className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "#6B7280" }}>
                              <Zap className="w-3.5 h-3.5" /> Insights ({results.insights.length})
                            </h4>
                          </div>
                          <div className="divide-y divide-gray-50">
                            {results.insights.map(ins => (
                              <div key={ins.id} className="px-4 py-3">
                                <p className="text-xs font-medium mb-0.5" style={{ color: "#111827" }}>{ins.title}</p>
                                <p className="text-[11px] leading-relaxed" style={{ color: "#6B7280" }}>{ins.description}</p>
                                <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600 font-bold">{ins.category}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Go to Tasks CTA */}
                      {createdCount > 0 && (
                        <button onClick={() => { navigate("/tasks"); onClose(); }} className="w-full py-3 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 shadow-md" style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}>
                          <ArrowRight className="w-4 h-4" /> View {createdCount} Created Task{createdCount !== 1 ? "s" : ""}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── HISTORY TAB ── */}
          {activeTab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full overflow-y-auto pr-2"
              style={{ scrollbarWidth: "thin" }}
            >
              <div className="max-w-2xl mx-auto">
                <h3 className="text-2xl italic mb-6" style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}>Recent Brain Dumps</h3>

                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-2xl" style={{ borderColor: "rgba(229,231,235,0.5)", color: "#D1D5DB" }}>
                    <History className="w-12 h-12 mb-3 opacity-40" />
                    <p className="text-sm opacity-70">No history yet</p>
                    <p className="text-xs mt-1 opacity-50">Process your first brain dump to see sessions here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((session, i) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-5 rounded-2xl border hover:shadow-md transition-all"
                        style={{ background: "rgba(255,255,255,0.85)", borderColor: "#E5E7EB" }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm font-medium" style={{ color: "#111827" }}>
                              {session.timestamp.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                              {session.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} &middot; {session.itemCount} item{session.itemCount !== 1 ? "s" : ""} dumped
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {session.tasksExtracted > 0 && (
                              <span className="text-[10px] px-2 py-1 rounded-full font-bold bg-green-50 text-green-600 border border-green-100">
                                {session.tasksExtracted} tasks
                              </span>
                            )}
                            {session.eventsExtracted > 0 && (
                              <span className="text-[10px] px-2 py-1 rounded-full font-bold bg-blue-50 text-blue-600 border border-blue-100">
                                {session.eventsExtracted} events
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>{session.summary}</p>
                        {session.tags.length > 0 && (
                          <div className="flex gap-1.5 mt-3 flex-wrap">
                            {session.tags.map(tagId => {
                              const tag = CONTEXT_TAGS.find(t => t.id === tagId);
                              return tag ? (
                                <span key={tagId} className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: tag.color + "20", color: tag.color }}>
                                  {tag.emoji} {tag.label}
                                </span>
                              ) : null;
                            })}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Footer hints ── */}
      <div className="shrink-0 px-8 py-3 border-t flex items-center justify-center gap-8 text-[10px]" style={{ borderColor: "rgba(0,0,0,0.06)", color: "#9CA3AF", background: "rgba(255,255,255,0.6)" }}>
        <span><kbd className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">\u2318+Enter</kbd> Add item</span>
        <span><kbd className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">Esc</kbd> Close</span>
        <span className="flex items-center gap-1"><Mic className="w-3 h-3" /> Voice input supported</span>
        <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> Works offline with local parser</span>
      </div>
    </div>
  );
}
