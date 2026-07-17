import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  Grid3x3,
  CheckCircle,
  User,
  Settings,
  Zap,
  Clock,
  Command,
  CornerDownLeft,
} from "lucide-react";
import { toast } from "sonner";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  category: "navigation" | "action";
  keywords?: string[];
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const commands: CommandItem[] = [
    // Quick Actions
    {
      id: "action-focus",
      label: "Start Focus Session",
      description: "Enter deep work mode",
      icon: <Zap className="w-4 h-4" />,
      action: () => navigate("/focus"),
      category: "action",
      keywords: ["focus", "deep work", "session", "start", "timer"],
    },
    // Navigation
    {
      id: "nav-home",
      label: "Home Dashboard",
      description: "Main overview",
      icon: <Grid3x3 className="w-4 h-4" />,
      action: () => navigate("/dashboard"),
      category: "navigation",
      keywords: ["home", "dashboard", "overview"],
    },
    {
      id: "nav-tasks",
      label: "Tasks",
      description: "Manage active tasks",
      icon: <CheckCircle className="w-4 h-4" />,
      action: () => navigate("/tasks"),
      category: "navigation",
      keywords: ["tasks", "todo", "checklist"],
    },
    {
      id: "nav-focus",
      label: "Focus Session",
      description: "Deep work timer",
      icon: <Clock className="w-4 h-4" />,
      action: () => navigate("/focus"),
      category: "navigation",
      keywords: ["focus", "session", "deep work", "timer"],
    },
    {
      id: "nav-profile",
      label: "Profile",
      description: "User settings",
      icon: <User className="w-4 h-4" />,
      action: () => navigate("/profile"),
      category: "navigation",
      keywords: ["profile", "account", "user"],
    },
    {
      id: "nav-settings",
      label: "Settings",
      description: "App preferences",
      icon: <Settings className="w-4 h-4" />,
      action: () => navigate("/settings"),
      category: "navigation",
      keywords: ["settings", "preferences", "config"],
    },
  ];

  const filteredCommands = query
    ? commands.filter((cmd) => {
        const q = query.toLowerCase();
        return (
          cmd.label.toLowerCase().includes(q) ||
          cmd.description?.toLowerCase().includes(q) ||
          cmd.keywords?.some((k) => k.includes(q))
        );
      })
    : commands;

  const groupedCommands = {
    action: filteredCommands.filter((c) => c.category === "action"),
    navigation: filteredCommands.filter((c) => c.category === "navigation"),
  };

  const flatFiltered = [...groupedCommands.action, ...groupedCommands.navigation];

  // Keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selected?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const executeCommand = useCallback(
    (cmd: CommandItem) => {
      setIsOpen(false);
      cmd.action();
      toast.success(`Navigated to ${cmd.label}`);
    },
    []
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, flatFiltered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatFiltered[selectedIndex]) {
        executeCommand(flatFiltered[selectedIndex]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-opacity duration-200"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(4px)",
        }}
        onClick={() => setIsOpen(false)}
      />

      {/* Palette */}
      <div
        className="relative w-full max-w-xl mx-4 rounded-2xl overflow-hidden"
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          border: "1px solid rgba(255, 255, 255, 0.6)",
          boxShadow:
            "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255,255,255,0.3), inset 0 0 0 1px rgba(255,255,255,0.1)",
          animation: "commandPaletteIn 0.2s ease-out",
        }}
      >
        {/* Search Input */}
        <div
          className="flex items-center gap-3 px-5 py-4 border-b"
          style={{ borderColor: "rgba(229, 231, 235, 0.5)" }}
        >
          <Search className="w-5 h-5 flex-shrink-0" style={{ color: "#9CA3AF" }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search screens, actions..."
            className="flex-1 bg-transparent outline-none text-[15px]"
            style={{
              color: "#111827",
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            }}
          />
          <kbd
            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border"
            style={{
              color: "#9CA3AF",
              backgroundColor: "rgba(243, 244, 246, 0.8)",
              borderColor: "#E5E7EB",
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          className="max-h-[50vh] overflow-y-auto py-2 scroll-smooth"
        >
          {flatFiltered.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm" style={{ color: "#9CA3AF" }}>
                No results found for "{query}"
              </p>
            </div>
          )}

          {groupedCommands.action.length > 0 && (
            <>
              <div
                className="px-5 py-2 text-[10px] font-bold uppercase tracking-[0.15em]"
                style={{ color: "#9CA3AF" }}
              >
                Quick Actions
              </div>
              {groupedCommands.action.map((cmd) => {
                const globalIdx = flatFiltered.indexOf(cmd);
                return (
                  <button
                    key={cmd.id}
                    data-index={globalIdx}
                    onClick={() => executeCommand(cmd)}
                    onMouseEnter={() => setSelectedIndex(globalIdx)}
                    className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors duration-100"
                    style={{
                      backgroundColor:
                        selectedIndex === globalIdx
                          ? "rgba(17, 24, 39, 0.06)"
                          : "transparent",
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor:
                          selectedIndex === globalIdx
                            ? "#111827"
                            : "rgba(243, 244, 246, 0.8)",
                        color:
                          selectedIndex === globalIdx ? "white" : "#6B7280",
                      }}
                    >
                      {cmd.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span
                        className="block text-sm font-medium truncate"
                        style={{ color: "#111827" }}
                      >
                        {cmd.label}
                      </span>
                      {cmd.description && (
                        <span
                          className="block text-xs truncate"
                          style={{ color: "#9CA3AF" }}
                        >
                          {cmd.description}
                        </span>
                      )}
                    </div>
                    {selectedIndex === globalIdx && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <CornerDownLeft
                          className="w-3 h-3"
                          style={{ color: "#9CA3AF" }}
                        />
                      </div>
                    )}
                  </button>
                );
              })}
            </>
          )}

          {groupedCommands.navigation.length > 0 && (
            <>
              <div
                className="px-5 py-2 text-[10px] font-bold uppercase tracking-[0.15em] mt-1"
                style={{ color: "#9CA3AF" }}
              >
                Go To
              </div>
              {groupedCommands.navigation.map((cmd) => {
                const globalIdx = flatFiltered.indexOf(cmd);
                return (
                  <button
                    key={cmd.id}
                    data-index={globalIdx}
                    onClick={() => executeCommand(cmd)}
                    onMouseEnter={() => setSelectedIndex(globalIdx)}
                    className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors duration-100"
                    style={{
                      backgroundColor:
                        selectedIndex === globalIdx
                          ? "rgba(17, 24, 39, 0.06)"
                          : "transparent",
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor:
                          selectedIndex === globalIdx
                            ? "#111827"
                            : "rgba(243, 244, 246, 0.8)",
                        color:
                          selectedIndex === globalIdx ? "white" : "#6B7280",
                      }}
                    >
                      {cmd.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span
                        className="block text-sm font-medium truncate"
                        style={{ color: "#111827" }}
                      >
                        {cmd.label}
                      </span>
                      {cmd.description && (
                        <span
                          className="block text-xs truncate"
                          style={{ color: "#9CA3AF" }}
                        >
                          {cmd.description}
                        </span>
                      )}
                    </div>
                    {selectedIndex === globalIdx && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <CornerDownLeft
                          className="w-3 h-3"
                          style={{ color: "#9CA3AF" }}
                        />
                      </div>
                    )}
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 border-t flex items-center justify-between"
          style={{
            borderColor: "rgba(229, 231, 235, 0.5)",
            backgroundColor: "rgba(249, 250, 251, 0.5)",
          }}
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <kbd
                className="px-1.5 py-0.5 rounded text-[10px] font-medium border"
                style={{
                  color: "#9CA3AF",
                  backgroundColor: "white",
                  borderColor: "#E5E7EB",
                }}
              >
                &uarr;
              </kbd>
              <kbd
                className="px-1.5 py-0.5 rounded text-[10px] font-medium border"
                style={{
                  color: "#9CA3AF",
                  backgroundColor: "white",
                  borderColor: "#E5E7EB",
                }}
              >
                &darr;
              </kbd>
              <span className="text-[10px] ml-1" style={{ color: "#9CA3AF" }}>
                Navigate
              </span>
            </div>
            <div className="flex items-center gap-1">
              <kbd
                className="px-1.5 py-0.5 rounded text-[10px] font-medium border"
                style={{
                  color: "#9CA3AF",
                  backgroundColor: "white",
                  borderColor: "#E5E7EB",
                }}
              >
                &crarr;
              </kbd>
              <span className="text-[10px] ml-1" style={{ color: "#9CA3AF" }}>
                Select
              </span>
            </div>
          </div>
          <span className="text-[10px]" style={{ color: "#9CA3AF" }}>
            {flatFiltered.length} result{flatFiltered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes commandPaletteIn {
          0% {
            opacity: 0;
            transform: scale(0.96) translateY(-8px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
