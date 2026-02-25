import { useState } from "react";
import { X, Zap, Clock, ArrowRight, ChevronDown } from "lucide-react";
import { BacklogItem } from "../services/storage-service";
import { toast } from "sonner@2.0.3";

interface AddBacklogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem?: (item: BacklogItem) => void;
}

export function AddBacklogModal({ isOpen, onClose, onAddItem }: AddBacklogModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [energy, setEnergy] = useState<"low" | "medium" | "high">("medium");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [estimatedTime, setEstimatedTime] = useState("45 mins");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    
    const newItem: BacklogItem = {
      id: `backlog-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || "No description provided.",
      priority: priority,
      energyLevel: energy,
      estimatedTime: `~${estimatedTime}`,
      createdAt: Date.now()
    };
    
    if (onAddItem) {
      onAddItem(newItem);
    }
    
    // Reset form
    setTitle("");
    setDescription("");
    setEnergy("medium");
    setPriority("medium");
    setEstimatedTime("45 mins");
    toast.success("Item added to backlog!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 transition-all duration-500"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.2)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)"
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className="w-full max-w-2xl relative rounded-3xl p-8 md:p-10 transform transition-all duration-300 scale-100 opacity-100"
        style={{
          background: "rgba(255, 255, 255, 0.75)",
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
          border: "1px solid rgba(255, 255, 255, 0.5)",
          borderTop: "1px solid rgba(255, 255, 255, 0.8)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 0 0 1px rgba(255,255,255,0.6)"
        }}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full transition-colors hover:bg-black/5"
          style={{ color: "#6B7280" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#111827";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#6B7280";
          }}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-8">
          <h2 
            className="text-4xl font-medium tracking-tight mb-2"
            style={{ 
              fontFamily: "'Playfair Display', serif",
              color: "#111827"
            }}
          >
            Add to Backlog
          </h2>
          <p 
            className="font-light text-sm tracking-wide"
            style={{ color: "#6B7280" }}
          >
            Capture now, schedule later.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Title Input */}
          <div className="space-y-2 group">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full text-2xl border-0 rounded-lg p-4 placeholder-gray-300 transition-all duration-300 focus:ring-0 focus:outline-none"
              style={{
                fontFamily: "'Playfair Display', serif",
                background: "white",
                boxShadow: "0 4px 20px rgba(0,0,0,0.03)"
              }}
            />
          </div>

          {/* Description Textarea */}
          <div className="space-y-2">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details, context, or subtasks..."
              rows={3}
              className="w-full border-0 rounded-xl px-4 py-3 text-sm placeholder-gray-400 resize-none transition-all duration-300 focus:ring-0 focus:outline-none shadow-inner"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.4)",
                color: "#111827"
              }}
              onFocus={(e) => {
                e.currentTarget.style.backgroundColor = "white";
              }}
              onBlur={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.4)";
              }}
            />
          </div>

          {/* Energy Requirement & Priority/Time Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Energy Requirement */}
            <div className="space-y-3">
              <label 
                className="text-[10px] font-bold uppercase tracking-[0.15em] ml-1"
                style={{ color: "#6B7280" }}
              >
                Energy Requirement
              </label>
              <div className="flex gap-3">
                {[
                  { value: "low", color: "#22C55E", label: "Low" },
                  { value: "medium", color: "#FB923C", label: "Med" },
                  { value: "high", color: "#EF4444", label: "High" }
                ].map((option) => (
                  <label key={option.value} className="flex-1 cursor-pointer group">
                    <input
                      type="radio"
                      name="energy"
                      value={option.value}
                      checked={energy === option.value}
                      onChange={(e) => setEnergy(e.target.value as "low" | "medium" | "high")}
                      className="hidden"
                    />
                    <div 
                      className="h-24 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all duration-300 hover:bg-white/60"
                      style={{
                        backgroundColor: energy === option.value ? "#fff" : "rgba(255, 255, 255, 0.3)",
                        borderColor: energy === option.value ? "rgba(0,0,0,0.1)" : "rgba(255, 255, 255, 0.5)",
                        boxShadow: energy === option.value ? "0 4px 12px rgba(0,0,0,0.05)" : "none",
                        transform: energy === option.value ? "translateY(-2px)" : "translateY(0)"
                      }}
                    >
                      <Zap 
                        className="w-5 h-5 transition-all" 
                        style={{ color: option.color }}
                        fill={energy === option.value ? option.color : "none"}
                      />
                      <span 
                        className="text-xs font-medium transition-colors"
                        style={{ color: energy === option.value ? "#111827" : "#6B7280" }}
                      >
                        {option.label}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Priority & Time */}
            <div className="space-y-6">
              {/* Priority Level */}
              <div className="space-y-3">
                <label 
                  className="text-[10px] font-bold uppercase tracking-[0.15em] ml-1"
                  style={{ color: "#6B7280" }}
                >
                  Priority Level
                </label>
                <div 
                  className="flex p-1 rounded-lg border shadow-inner"
                  style={{
                    backgroundColor: "rgba(243, 244, 246, 0.5)",
                    borderColor: "rgba(255, 255, 255, 0.4)"
                  }}
                >
                  {["low", "medium", "high"].map((level) => (
                    <label key={level} className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        name="priority"
                        value={level}
                        checked={priority === level}
                        onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
                        className="hidden"
                      />
                      <span 
                        className="block text-center py-2 rounded-md text-xs font-medium transition-all duration-300"
                        style={{
                          backgroundColor: priority === level ? "white" : "transparent",
                          color: priority === level ? "#111827" : "#6B7280",
                          boxShadow: priority === level ? "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" : "none",
                          borderColor: priority === level ? "rgba(255,255,255,0.8)" : "transparent"
                        }}
                      >
                        {level === "medium" ? "Med" : level.charAt(0).toUpperCase() + level.slice(1)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Estimated Time */}
              <div className="space-y-3">
                <label 
                  className="text-[10px] font-bold uppercase tracking-[0.15em] ml-1"
                  style={{ color: "#6B7280" }}
                >
                  Estimated Time
                </label>
                <div className="relative">
                  <Clock 
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px]"
                    style={{ color: "#6B7280" }}
                  />
                  <select
                    value={estimatedTime}
                    onChange={(e) => setEstimatedTime(e.target.value)}
                    className="w-full border-0 rounded-xl pl-9 pr-4 py-3 text-sm cursor-pointer appearance-none transition-colors focus:ring-0 focus:outline-none shadow-sm"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.5)",
                      color: "#111827"
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.backgroundColor = "white";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.5)";
                    }}
                  >
                    <option>15 mins</option>
                    <option>30 mins</option>
                    <option>45 mins</option>
                    <option>1 hour</option>
                    <option>2 hours</option>
                    <option>4+ hours</option>
                  </select>
                  <ChevronDown 
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] pointer-events-none"
                    style={{ color: "#6B7280" }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6 flex justify-end">
            <button
              type="submit"
              className="group relative text-white pl-8 pr-10 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 overflow-hidden hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: "#111827" }}
            >
              <div 
                className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
              />
              <span className="relative font-bold tracking-wide text-sm">
                Add to Hub
              </span>
              <ArrowRight className="w-4 h-4 relative group-hover:translate-x-1 transition-transform" />
              <span 
                className="absolute right-3 top-3 w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: "#4ADE80" }}
              />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}