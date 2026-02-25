import { useState, useEffect } from "react";
import {
  GripVertical,
  Filter,
  Plus,
  Zap,
  Clock,
  ArrowRight,
  MoveDown,
  Trash2
} from "lucide-react";
import { AddBacklogModal } from "./AddBacklogModal";
import { storageService, BacklogItem } from "../services/storage-service";
import { createTask } from "../services/task-service";
import { toast } from "sonner@2.0.3";
import { useProfile } from "../context/ProfileContext";
import { NotificationCenter } from "./NotificationCenter";

export function BacklogScreen() {
  const [backlogItems, setBacklogItems] = useState<BacklogItem[]>([]);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filterPriority, setFilterPriority] = useState<"all" | "high" | "medium" | "low">("all");
  const { profile } = useProfile();

  // Load backlog items from storage on mount
  useEffect(() => {
    const items = storageService.getBacklogItems();
    setBacklogItems(items);
  }, []);

  const toggleComplete = (id: string) => {
    setCompletedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleDeleteItem = (itemId: string, itemTitle: string) => {
    storageService.deleteBacklogItem(itemId);
    const updatedItems = storageService.getBacklogItems();
    setBacklogItems(updatedItems);
    toast.success(`"${itemTitle}" removed from backlog`);
  };

  const handleAddItem = (newItem: BacklogItem) => {
    storageService.saveBacklogItem(newItem);
    const updatedItems = storageService.getBacklogItems();
    setBacklogItems(updatedItems);
    setIsModalOpen(false);
    toast.success("Item added to backlog!");
  };

  const handleQuickMoveToTasks = async (item: BacklogItem) => {
    // Create task with Supabase
    const result = await createTask({
      title: item.title,
      description: item.description,
      status: 'todo',
      priority: item.priority === 'high' ? 'urgent' : item.priority,
      tags: [],
      estimatedMinutes: parseInt(item.estimatedTime) || 30
    });

    if (result.success) {
      // Remove from backlog
      storageService.deleteBacklogItem(item.id);
      const updatedItems = storageService.getBacklogItems();
      setBacklogItems(updatedItems);
      toast.success(`"${item.title}" moved to active tasks!`);
    } else {
      toast.error(`Failed to move task: ${result.error}`);
    }
  };

  const handleQuickEstimate = () => {
    const totalMinutes = backlogItems.reduce((acc, item) => {
      const mins = parseInt(item.estimatedTime) || 30;
      return acc + mins;
    }, 0);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    toast.success("Quick Estimate", {
      description: `Total estimated time for ${backlogItems.length} items: ${hours}h ${mins}m`
    });
  };

  const handleFilter = () => {
    setShowFilterMenu(!showFilterMenu);
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "high":
        return {
          bg: "rgba(254, 242, 242, 1)",
          text: "#DC2626",
          border: "#FECACA"
        };
      case "medium":
        return {
          bg: "rgba(239, 246, 255, 1)",
          text: "#2563EB",
          border: "#DBEAFE"
        };
      case "low":
        return {
          bg: "rgba(243, 244, 246, 1)",
          text: "#6B7280",
          border: "#E5E7EB"
        };
      default:
        return {
          bg: "rgba(243, 244, 246, 1)",
          text: "#6B7280",
          border: "#E5E7EB"
        };
    }
  };

  const getEnergyColor = (energy: string) => {
    switch (energy) {
      case "high":
        return "#EAB308";
      case "medium":
        return "#FB923C";
      case "low":
        return "#22C55E";
      default:
        return "#6B7280";
    }
  };

  const getEnergyLabel = (energy: string) => {
    switch (energy) {
      case "high":
        return "High Energy";
      case "medium":
        return "Med Energy";
      case "low":
        return "Low Energy";
      default:
        return "Unknown";
    }
  };

  const filteredBacklogItems = backlogItems.filter(item => {
    if (filterPriority === "all") return true;
    return item.priority === filterPriority;
  });

  return (
    <div className="flex-1 overflow-hidden flex flex-col" style={{ backgroundColor: "#F8F9FA" }}>
      {/* Noise Texture Overlay */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none mix-blend-overlay opacity-60"
        style={{
          backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noiseFilter\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.65\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noiseFilter)\" opacity=\"0.05\"/%3E%3C/svg%3E')"
        }}
      />

      {/* Header */}
      <header 
        className="h-24 border-b flex items-center justify-between px-10 z-20 sticky top-0 shadow-sm"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderColor: "rgba(255, 255, 255, 0.5)"
        }}
      >
        <div className="flex flex-col">
          <h1 
            className="text-sm font-semibold tracking-wide uppercase"
            style={{ color: "#6B7280" }}
          >
            Backlog Hub
          </h1>
          <p 
            className="text-2xl italic"
            style={{ 
              fontFamily: "'Playfair Display', serif",
              color: "#111827" 
            }}
          >
            Unscheduled Tasks
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div 
            className="flex items-center gap-3 px-4 py-2 rounded-full border shadow-sm"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.6)",
              backdropFilter: "blur(4px)",
              borderColor: "rgba(255, 255, 255, 0.8)"
            }}
          >
            <Zap className="w-4 h-4 fill-yellow-500" style={{ color: "#EAB308" }} />
            <span className="text-xs font-bold tracking-wide" style={{ color: "#111827" }}>
              ENERGY CAP: 80%
            </span>
          </div>

          <div className="h-10 w-px bg-gray-200"></div>

          <NotificationCenter />

          <div className="w-10 h-10 rounded-full ring-2 ring-white shadow-lg overflow-hidden">
            <img 
              alt={profile.fullName} 
              className="w-full h-full object-cover" 
              src={profile.profileImage}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-10 scroll-smooth">
        <div className="max-w-7xl mx-auto h-full flex flex-col gap-8">
          {/* Title Section */}
          <div className="flex justify-between items-end shrink-0">
            <div>
              <h2 
                className="text-5xl font-medium tracking-tight leading-tight"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  color: "#111827",
                  animation: "settle 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards"
                }}
              >
                Action Items
              </h2>
              <p 
                className="mt-3 text-lg font-light tracking-wide max-w-lg opacity-0"
                style={{
                  color: "#6B7280",
                  animation: "fadeInUp 0.8s ease-out 0.2s forwards"
                }}
              >
                Prioritize and move tasks to your active timeline.
              </p>
            </div>

            <div className="flex gap-4">
              <button 
                className="bg-white hover:bg-gray-50 border px-6 py-4 rounded-xl shadow-sm transition-all duration-300 flex items-center gap-2 font-medium relative"
                style={{
                  color: filterPriority !== "all" ? "white" : "#111827",
                  backgroundColor: filterPriority !== "all" ? "#111827" : "white",
                  borderColor: filterPriority !== "all" ? "#111827" : "#E5E7EB"
                }}
                onClick={handleFilter}
              >
                <Filter className="w-4 h-4" />
                Filter {filterPriority !== "all" && `(${filterPriority})`}
              </button>
              {showFilterMenu && (
                <div 
                  className="absolute right-[180px] top-full mt-2 w-48 rounded-xl shadow-lg border p-2 z-50"
                  style={{ backgroundColor: "white", borderColor: "#E5E7EB" }}
                >
                  {(["all", "high", "medium", "low"] as const).map((priority) => (
                    <button
                      key={priority}
                      className="w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize"
                      style={{ 
                        color: filterPriority === priority ? "#111827" : "#6B7280",
                        backgroundColor: filterPriority === priority ? "#F3F4F6" : "transparent"
                      }}
                      onClick={() => {
                        setFilterPriority(priority);
                        setShowFilterMenu(false);
                        toast.info(priority === "all" ? "Showing all items" : `Filtered by ${priority} priority`);
                      }}
                    >
                      {priority === "all" ? "All Priorities" : `${priority} Priority`}
                    </button>
                  ))}
                </div>
              )}

              <button 
                onClick={() => setIsModalOpen(true)}
                className="group relative overflow-hidden text-white px-7 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.03] active:scale-95 flex items-center gap-2 font-medium"
                style={{
                  backgroundColor: "#111827",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), inset 0 0 0 1px rgba(255,255,255,0.1)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#000000";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#111827";
                }}
              >
                <div 
                  className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                />
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                New Item
              </button>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="flex gap-8 h-full pb-10">
            {/* Backlog Items List */}
            <div className="flex-1 space-y-4">
              <div 
                className="flex items-center justify-between text-sm uppercase tracking-wider font-bold pb-2 px-2"
                style={{ color: "rgba(107, 114, 128, 0.6)" }}
              >
                <span>Incoming Tasks ({backlogItems.length})</span>
                <span>Sort by: Energy</span>
              </div>

              {filteredBacklogItems.map((item, index) => {
                const priorityStyle = getPriorityStyle(item.priority);
                return (
                  <div
                    key={item.id}
                    className="group rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer relative opacity-0"
                    style={{
                      background: "rgba(255, 255, 255, 0.55)",
                      backdropFilter: "blur(24px) saturate(180%)",
                      WebkitBackdropFilter: "blur(24px) saturate(180%)",
                      border: "1px solid rgba(255, 255, 255, 0.4)",
                      boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.05)",
                      animation: `fadeInUp 0.8s ease-out ${0.3 + index * 0.1}s forwards`
                    }}
                  >
                    {/* Refraction Border Effect */}
                    <div 
                      className="absolute inset-0 rounded-2xl opacity-80 pointer-events-none"
                      style={{
                        padding: "1px",
                        background: "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.1) 40%, rgba(255,255,255,0.05) 60%, rgba(255,255,255,0.6))",
                        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                        WebkitMaskComposite: "xor",
                        maskComposite: "exclude"
                      }}
                    />

                    <div className="flex items-center gap-5 relative z-10">
                      {/* Checkbox */}
                      <label className="relative flex items-center justify-center cursor-pointer group/checkbox">
                        <input
                          type="checkbox"
                          checked={completedItems.has(item.id)}
                          onChange={() => toggleComplete(item.id)}
                          className="sr-only peer"
                        />
                        <div 
                          className="w-6 h-6 rounded-lg border-2 transition-all duration-300 flex items-center justify-center peer-checked:bg-indigo-600 peer-checked:border-indigo-600 group-hover/checkbox:border-indigo-400"
                          style={{
                            borderColor: completedItems.has(item.id) ? "#4F46E5" : "#D1D5DB",
                            backgroundColor: completedItems.has(item.id) ? "#4F46E5" : "white"
                          }}
                        >
                          {completedItems.has(item.id) && (
                            <svg 
                              className="w-4 h-4 text-white animate-[checkmark_0.3s_ease-out]" 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                d="M5 13l4 4L19 7" 
                              />
                            </svg>
                          )}
                        </div>
                      </label>

                      <div 
                        className="text-gray-300 hover:text-primary transition-colors p-1 cursor-grab active:cursor-grabbing"
                        style={{ color: "#D1D5DB" }}
                      >
                        <GripVertical className="w-5 h-5" />
                      </div>

                      <div className={`flex-1 transition-all duration-300 ${completedItems.has(item.id) ? 'opacity-50' : 'opacity-100'}`}>
                        <div className="flex justify-between items-start mb-1">
                          <h3 
                            className="font-semibold text-xl group-hover:text-blue-900 transition-colors"
                            style={{ 
                              fontFamily: "'Playfair Display', serif",
                              color: "#111827"
                            }}
                          >
                            {item.title}
                          </h3>
                          <span 
                            className="px-2 py-1 rounded text-[10px] font-bold border uppercase tracking-wider"
                            style={{
                              backgroundColor: priorityStyle.bg,
                              color: priorityStyle.text,
                              borderColor: priorityStyle.border
                            }}
                          >
                            {item.priority} Priority
                          </span>
                        </div>

                        <p 
                          className="text-sm font-light mb-4"
                          style={{ color: "#6B7280" }}
                        >
                          {item.description}
                        </p>

                        <div 
                          className="flex items-center gap-6 border-t pt-3"
                          style={{ borderColor: "rgba(243, 244, 246, 0.5)" }}
                        >
                          <div 
                            className="flex items-center gap-2 text-xs font-medium"
                            style={{ color: "#6B7280" }}
                          >
                            <Zap 
                              className="w-[18px] h-[18px]" 
                              style={{ color: getEnergyColor(item.energyLevel) }}
                            />
                            <span>{getEnergyLabel(item.energyLevel)}</span>
                          </div>

                          <div 
                            className="flex items-center gap-2 text-xs font-medium"
                            style={{ color: "#6B7280" }}
                          >
                            <Clock className="w-[18px] h-[18px]" />
                            <span>{item.estimatedTime}</span>
                          </div>

                          <div className="flex-1"></div>

                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteItem(item.id, item.title);
                            }}
                            className="text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          <button 
                            className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity hover:text-blue-600"
                            style={{ color: "#111827" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickMoveToTasks(item);
                            }}
                          >
                            Quick Move <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Active Timeline Sidebar */}
            <div 
              className="w-80 shrink-0 hidden lg:block opacity-0"
              style={{ animation: "fadeInUp 0.8s ease-out 0.4s forwards" }}
            >
              <div 
                className="rounded-3xl h-full p-6 border flex flex-col relative overflow-hidden"
                style={{
                  background: "rgba(255, 255, 255, 0.55)",
                  backdropFilter: "blur(24px) saturate(180%)",
                  WebkitBackdropFilter: "blur(24px) saturate(180%)",
                  borderColor: "rgba(255, 255, 255, 0.6)"
                }}
              >
                {/* Top Gradient Overlay */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "linear-gradient(to bottom, rgba(255, 255, 255, 0.4), transparent)"
                  }}
                />

                <div className="flex items-center justify-between mb-8 z-10">
                  <h3 
                    className="text-xl italic font-medium"
                    style={{ 
                      fontFamily: "'Playfair Display', serif",
                      color: "#111827"
                    }}
                  >
                    Active Timeline
                  </h3>
                  <span 
                    className="text-xs font-bold px-2 py-1 rounded"
                    style={{
                      color: "#6B7280",
                      backgroundColor: "rgba(255, 255, 255, 0.5)"
                    }}
                  >
                    TODAY
                  </span>
                </div>

                <div className="flex-1 relative z-10 space-y-6">
                  {/* Completed Item */}
                  <div className="flex gap-4 opacity-50">
                    <div className="flex flex-col items-center">
                      <span 
                        className="text-xs font-bold"
                        style={{ color: "#6B7280" }}
                      >
                        09:00
                      </span>
                      <div className="w-px h-full bg-gray-300 my-1"></div>
                    </div>
                    <div 
                      className="rounded-xl p-3 border w-full"
                      style={{
                        backgroundColor: "rgba(249, 250, 251, 0.5)",
                        borderColor: "rgba(229, 231, 235, 0.5)"
                      }}
                    >
                      <span 
                        className="text-xs font-bold block line-through"
                        style={{ color: "#111827" }}
                      >
                        Team Standup
                      </span>
                    </div>
                  </div>

                  {/* Active Item */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span 
                        className="text-xs font-bold"
                        style={{ color: "#111827" }}
                      >
                        10:30
                      </span>
                      <div className="w-px h-full my-1 relative" style={{ backgroundColor: "rgba(17, 24, 39, 0.2)" }}>
                        <div 
                          className="absolute top-0 w-full h-1/2"
                          style={{ backgroundColor: "#111827" }}
                        ></div>
                      </div>
                    </div>
                    <div 
                      className="bg-white rounded-xl p-4 border shadow-md w-full"
                      style={{
                        borderColor: "white",
                        boxShadow: "0 0 0 2px rgba(17, 24, 39, 0.05)"
                      }}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span 
                          className="text-xs font-bold"
                          style={{ color: "#111827" }}
                        >
                          Project Phoenix
                        </span>
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      </div>
                      <p className="text-[10px]" style={{ color: "#6B7280" }}>
                        In progress...
                      </p>
                    </div>
                  </div>

                  {/* Drop Zone */}
                  <div 
                    className="mt-4 border-2 border-dashed rounded-2xl h-32 flex flex-col items-center justify-center text-center p-4 transition-colors"
                    style={{
                      borderColor: "#D1D5DB",
                      backgroundColor: "rgba(255, 255, 255, 0.1)"
                    }}
                  >
                    <MoveDown className="w-6 h-6 mb-2" style={{ color: "#9CA3AF" }} />
                    <span 
                      className="text-xs font-bold uppercase tracking-widest"
                      style={{ color: "#9CA3AF" }}
                    >
                      Drag here to schedule
                    </span>
                  </div>

                  {/* Future Slot */}
                  <div 
                    className="mt-2 border-2 border-dashed rounded-2xl h-20 flex flex-col items-center justify-center text-center p-4"
                    style={{
                      borderColor: "rgba(209, 213, 219, 0.6)",
                      backgroundColor: "rgba(255, 255, 255, 0.05)"
                    }}
                  >
                    <span 
                      className="text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: "#D1D5DB" }}
                    >
                      13:00 Slot
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Quick Estimate Button */}
      <div className="fixed bottom-10 right-10 z-50">
        <button 
          className="group text-white rounded-full px-8 py-4 shadow-lg flex items-center gap-3 transition-all duration-500 hover:scale-105 active:scale-95"
          style={{
            backgroundColor: "rgba(17, 24, 39, 0.9)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            animation: "breathe 3s ease-in-out infinite"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#000000";
            e.currentTarget.style.boxShadow = "0 0 30px rgba(17, 24, 39, 0.3), 0 0 60px rgba(17, 24, 39, 0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(17, 24, 39, 0.9)";
            e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
          }}
          onClick={handleQuickEstimate}
        >
          <Zap className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          <span className="font-bold tracking-wide text-xs uppercase">Quick Estimate</span>
        </button>
      </div>

      {/* Add Backlog Modal */}
      <AddBacklogModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddItem={handleAddItem} />

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
        @keyframes checkmark {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}