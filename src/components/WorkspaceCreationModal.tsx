import { useState } from "react";
import { 
  X, 
  Layers, 
  Rocket, 
  Megaphone, 
  Diamond, 
  Zap, 
  Terminal, 
  Plus,
  ArrowRight
} from "lucide-react";

interface WorkspaceCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateWorkspace?: (data: WorkspaceData) => void;
}

export interface WorkspaceData {
  name: string;
  icon: string;
  teamEmails: string[];
}

const iconOptions = [
  { id: "layers", icon: Layers, label: "Layers" },
  { id: "rocket", icon: Rocket, label: "Rocket" },
  { id: "campaign", icon: Megaphone, label: "Campaign" },
  { id: "diamond", icon: Diamond, label: "Diamond" },
  { id: "bolt", icon: Zap, label: "Bolt" },
  { id: "terminal", icon: Terminal, label: "Terminal" },
  { id: "add", icon: Plus, label: "Add" },
];

export function WorkspaceCreationModal({ isOpen, onClose, onCreateWorkspace }: WorkspaceCreationModalProps) {
  const [workspaceName, setWorkspaceName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("layers");
  const [teamEmails, setTeamEmails] = useState(["alex@kaal.design", "sarah@kaal.design"]);
  const [emailInput, setEmailInput] = useState("");

  if (!isOpen) return null;

  const handleAddEmail = () => {
    if (emailInput.trim() && emailInput.includes("@")) {
      setTeamEmails([...teamEmails, emailInput.trim()]);
      setEmailInput("");
    }
  };

  const handleRemoveEmail = (index: number) => {
    setTeamEmails(teamEmails.filter((_, i) => i !== index));
  };

  const handleCreate = () => {
    const workspaceData: WorkspaceData = {
      name: workspaceName || "Q4 Marketing Sprint",
      icon: selectedIcon,
      teamEmails,
    };
    
    if (onCreateWorkspace) {
      onCreateWorkspace(workspaceData);
    }
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddEmail();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(200, 203, 210, 0.2)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl rounded-3xl shadow-2xl border relative overflow-hidden"
        style={{
          background: "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          borderColor: "rgba(255, 255, 255, 0.6)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255,255,255,0.8)",
          animation: "fadeInUp 0.8s ease-out forwards"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top gradient bar */}
        <div 
          className="absolute top-0 left-0 w-full h-2 opacity-80"
          style={{
            background: "linear-gradient(to right, #60A5FA, #A78BFA, #F472B6)"
          }}
        ></div>

        {/* Decorative blobs */}
        <div 
          className="absolute -top-24 -right-24 w-64 h-64 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: "#C084FC" }}
        ></div>
        <div 
          className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: "#60A5FA" }}
        ></div>

        <div className="p-10 relative z-10">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 
                className="text-3xl font-bold tracking-tight"
                style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
              >
                Establish New Workspace
              </h2>
              <p 
                className="mt-1 text-sm font-medium tracking-wide"
                style={{ color: "#6B7280" }}
              >
                Create a dedicated environment for your team's best work.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/50 transition-colors"
              style={{ color: "#6B7280" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#111827"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#6B7280"}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-8">
            {/* Workspace Name */}
            <div className="group">
              <label 
                className="block text-xs font-bold uppercase tracking-widest mb-2 ml-1"
                style={{ color: "#6B7280" }}
              >
                Workspace Name
              </label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="e.g. Q4 Marketing Sprint"
                className="w-full border rounded-xl px-4 py-3 text-lg font-medium placeholder-gray-400 focus:outline-none focus:ring-0 transition-all"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.6)",
                  borderColor: "#E5E7EB",
                  color: "#111827"
                }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = "0 0 0 4px rgba(255, 255, 255, 0.5), 0 4px 12px rgba(0,0,0,0.05)";
                  e.currentTarget.style.borderColor = "rgba(17, 24, 39, 0.2)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = "#E5E7EB";
                }}
              />
            </div>

            {/* Workspace Icon */}
            <div>
              <label 
                className="block text-xs font-bold uppercase tracking-widest mb-3 ml-1"
                style={{ color: "#6B7280" }}
              >
                Workspace Icon
              </label>
              <div 
                className="flex gap-3 overflow-x-auto pb-2"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {iconOptions.map((option) => {
                  const IconComponent = option.icon;
                  const isSelected = selectedIcon === option.id;
                  
                  return (
                    <button
                      key={option.id}
                      onClick={() => setSelectedIcon(option.id)}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected ? "shadow-lg ring-2 ring-offset-2" : "border"
                      }`}
                      style={{
                        backgroundColor: isSelected ? "#111827" : "rgba(255, 255, 255, 0.5)",
                        color: isSelected ? "white" : "#6B7280",
                        borderColor: isSelected ? "transparent" : "rgba(255, 255, 255, 0.6)",
                        ringColor: isSelected ? "rgba(17, 24, 39, 0.2)" : "transparent",
                        transform: isSelected ? "scale(1)" : "scale(1)"
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
                          e.currentTarget.style.color = "#111827";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.5)";
                          e.currentTarget.style.color = "#6B7280";
                        }
                      }}
                    >
                      <IconComponent className="w-6 h-6" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Team Invitation */}
            <div>
              <label 
                className="block text-xs font-bold uppercase tracking-widest mb-2 ml-1"
                style={{ color: "#6B7280" }}
              >
                Team Invitation
              </label>
              <div 
                className="border rounded-xl p-2 flex flex-wrap gap-2 transition-all shadow-sm"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.6)",
                  borderColor: "#E5E7EB"
                }}
              >
                {teamEmails.map((email, index) => (
                  <div
                    key={index}
                    className="bg-gray-100 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium border border-gray-200"
                    style={{ 
                      color: "#111827",
                      animation: "fadeIn 0.3s ease-out"
                    }}
                  >
                    <span>{email}</span>
                    <button
                      onClick={() => handleRemoveEmail(index)}
                      className="text-gray-400 hover:text-red-500 transition-colors flex items-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add email addresses..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-2 py-1.5 min-w-[150px] focus:outline-none"
                  style={{ color: "#111827" }}
                />
                <button
                  onClick={handleAddEmail}
                  className="rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors"
                  style={{
                    backgroundColor: "#111827",
                    color: "white"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "black"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#111827"}
                >
                  Add
                </button>
              </div>
              <p 
                className="text-xs mt-2 ml-1"
                style={{ color: "#6B7280" }}
              >
                Team members will receive an invite link via email.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div 
            className="mt-10 pt-6 flex items-center justify-end gap-4"
            style={{ borderTop: "1px solid rgba(229, 231, 235, 0.5)" }}
          >
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ color: "#6B7280" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#111827";
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.5)";
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
              className="px-8 py-3 rounded-xl shadow-lg flex items-center gap-2 group transition-all"
              style={{
                backgroundColor: "#111827",
                color: "white",
                boxShadow: "0 10px 15px -3px rgba(17, 24, 39, 0.2)",
                animation: "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(17, 24, 39, 0.4)";
                e.currentTarget.style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(17, 24, 39, 0.2)";
                e.currentTarget.style.transform = "scale(1)";
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.98)"}
              onMouseUp={(e) => e.currentTarget.style.transform = "scale(1.02)"}
            >
              <span className="font-bold tracking-wide text-sm">Create Workspace</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Animations */}
        <style>{`
          @keyframes fadeInUp {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
          }
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>
    </div>
  );
}
