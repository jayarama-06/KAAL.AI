import { motion } from "motion/react";
import { Link } from "react-router";
import { 
  Plus, 
  Diamond, 
  Rocket, 
  Code, 
  Palette,
  Shield,
  Users,
  Search,
  Bell,
  Settings,
  ArrowUpDown,
  LayoutGrid
} from "lucide-react";
import { useState } from "react";
import { WorkspaceCreationModal, WorkspaceData } from "./WorkspaceCreationModal";
import { toast } from "sonner@2.0.3";
import { useWorkspaces } from "../hooks/useWorkspaces";

export function WorkspaceDirectoryScreen() {
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"active" | "name" | "members">("active");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  const { workspaces, loading, createWorkspace, touchWorkspace, getSortedWorkspaces } = useWorkspaces();

  const handleCreateWorkspace = (data: WorkspaceData) => {
    createWorkspace({
      name: data.name,
      icon: data.icon,
      teamEmails: data.teamEmails
    });
  };

  const handleSortToggle = () => {
    const options: Array<"active" | "name" | "members"> = ["active", "name", "members"];
    const currentIndex = options.indexOf(sortBy);
    const next = options[(currentIndex + 1) % options.length];
    setSortBy(next);
    toast.info(`Sorted by ${next === "active" ? "Last Active" : next === "name" ? "Name" : "Member Count"}`);
  };

  const handleViewToggle = () => {
    setViewMode(prev => prev === "grid" ? "list" : "grid");
    toast.info(`Switched to ${viewMode === "grid" ? "list" : "grid"} view`);
  };

  // Map icon strings to Lucide components
  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      diamond: Diamond,
      rocket: Rocket,
      code: Code,
      palette: Palette,
      layers: Code, // fallback
      zap: Rocket, // fallback
      star: Diamond, // fallback
    };
    return icons[iconName.toLowerCase()] || Diamond;
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header Section */}
      <div 
        className="px-10 pt-8 pb-6"
        style={{
          opacity: 0,
          animation: "fadeInUp 0.8s ease-out forwards"
        }}
      >
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 
              className="text-sm font-semibold tracking-wide uppercase"
              style={{ color: "#6B7280" }}
            >
              KAAL System
            </h1>
            <p 
              className="text-2xl italic"
              style={{ 
                fontFamily: "Playfair Display, serif",
                color: "#111827"
              }}
            >
              Workspace Directory
            </p>
          </div>
          
          <div className="flex gap-3">
            <button 
              className="bg-white/60 hover:bg-white text-gray-700 px-5 py-2.5 rounded-lg shadow-sm border border-white/60 transition-all text-sm font-medium flex items-center gap-2"
              onClick={handleSortToggle}
            >
              <ArrowUpDown className="w-4 h-4" />
              {sortBy === "active" ? "Last Active" : sortBy === "name" ? "Name" : "Members"}
            </button>
            <button 
              className="bg-white/60 hover:bg-white text-gray-700 px-5 py-2.5 rounded-lg shadow-sm border border-white/60 transition-all text-sm font-medium flex items-center gap-2"
              onClick={handleViewToggle}
            >
              <LayoutGrid className="w-4 h-4" />
              {viewMode === "grid" ? "Grid" : "List"}
            </button>
          </div>
        </div>

        <div>
          <h2 
            className="text-4xl font-medium tracking-tight leading-tight mb-2"
            style={{ 
              fontFamily: "Playfair Display, serif",
              color: "#111827",
              opacity: 0,
              animation: "settle 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards"
            }}
          >
            Your Spaces
          </h2>
          <p 
            className="text-lg font-light tracking-wide max-w-lg"
            style={{ 
              color: "#6B7280",
              opacity: 0,
              animation: "fadeInUp 0.8s ease-out 0.2s forwards"
            }}
          >
            Access your active environments and manage team collaborations.
          </p>
        </div>
      </div>

      {/* Workspace Grid */}
      <div className="px-10 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[minmax(240px,auto)]">
          {/* Create New Workspace Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="group cursor-pointer"
            onClick={() => setIsWorkspaceModalOpen(true)}
          >
            <div 
              className="h-full flex flex-col items-center justify-center text-center gap-4 rounded-3xl p-8 border-dashed border-2 transition-all duration-300 hover:border-indigo-300 hover:bg-white/40"
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                borderColor: "#D1D5DB",
                boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.05)"
              }}
            >
              <div 
                className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center text-gray-800 group-hover:scale-110 transition-transform duration-300"
                style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.05)" }}
              >
                <Plus className="w-8 h-8" />
              </div>
              <div className="mt-2">
                <h3 className="text-xl font-bold text-gray-800 mb-1">Create Workspace</h3>
                <p className="text-sm" style={{ color: "#6B7280" }}>Start a new project environment</p>
              </div>
            </div>
          </motion.div>

          {/* Workspace Cards */}
          {getSortedWorkspaces(sortBy).map((workspace, index) => (
            <motion.div
              key={workspace.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
            >
              <Link to={`/workspace/${workspace.id}`}>
                <div 
                  className="h-full rounded-3xl p-8 relative overflow-hidden group cursor-pointer transition-all duration-400 hover:translate-y-[-4px] hover:scale-[1.01]"
                  style={{
                    background: "rgba(255, 255, 255, 0.55)",
                    backdropFilter: "blur(24px) saturate(180%)",
                    border: "1px solid rgba(255, 255, 255, 0.4)",
                    boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.05)"
                  }}
                >
                  {/* Gradient overlay */}
                  <div 
                    className="absolute inset-0 opacity-50"
                    style={{
                      background: "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 40%)"
                    }}
                  />
                  
                  {/* Header */}
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div 
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${workspace.gradient} flex items-center justify-center text-white shadow-lg`}
                      style={{
                        backgroundSize: "200% 200%",
                        animation: "gradientMove 6s ease infinite"
                      }}
                    >
                      {(() => {
                        const IconComponent = getIconComponent(workspace.icon);
                        return <IconComponent className="w-6 h-6" fill="currentColor" />;
                      })()}
                    </div>
                    <div 
                      className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md border"
                      style={{
                        background: "rgba(255, 255, 255, 0.5)",
                        backdropFilter: "blur(4px)",
                        color: "#6B7280",
                        borderColor: "rgba(255, 255, 255, 0.6)",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.05)"
                      }}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>{workspace.members}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="relative z-10 mb-6">
                    <h3 
                      className="text-2xl font-bold text-gray-800 mb-1"
                      style={{ fontFamily: "Playfair Display, serif" }}
                    >
                      {workspace.name}
                    </h3>
                    <p className="text-sm line-clamp-1" style={{ color: "#6B7280" }}>
                      {workspace.description}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="space-y-3 relative z-10">
                    <div className="flex justify-between text-xs font-medium" style={{ color: "rgba(107, 114, 128, 0.8)" }}>
                      <span>Active Projects</span>
                      <span>{workspace.activeProjects}/{workspace.totalProjects}</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${workspace.progressColor} rounded-full`}
                        style={{ 
                          width: `${workspace.progress}%`,
                          boxShadow: `0 0 8px ${workspace.progressColor === 'bg-indigo-500' ? 'rgba(99,102,241,0.4)' : 
                                                  workspace.progressColor === 'bg-pink-500' ? 'rgba(236,72,153,0.4)' :
                                                  workspace.progressColor === 'bg-cyan-500' ? 'rgba(6,182,212,0.4)' : 'rgba(251,146,60,0.4)'}`
                        }}
                      />
                    </div>

                    {/* Footer */}
                    <div className="pt-4 flex items-center justify-between border-t" style={{ borderColor: "rgba(229, 231, 235, 0.5)" }}>
                      <div className="flex -space-x-2">
                        {workspace.memberImages.map((img, idx) => (
                          <img 
                            key={idx}
                            alt="Member" 
                            className="w-7 h-7 rounded-full border-2 border-white" 
                            src={img}
                          />
                        ))}
                        <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold" style={{ color: "#6B7280" }}>
                          +{workspace.additionalMembers}
                        </div>
                      </div>

                      {/* Sparkline */}
                      <div className="h-8 w-24">
                        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 30">
                          <path 
                            d={workspace.sparklineData}
                            fill="none" 
                            stroke={workspace.progressColor === 'bg-indigo-500' ? '#6366f1' : 
                                   workspace.progressColor === 'bg-pink-500' ? '#ec4899' :
                                   workspace.progressColor === 'bg-cyan-500' ? '#06b6d4' : '#fb923c'}
                            strokeLinecap="round" 
                            strokeWidth="2"
                            style={{
                              strokeDasharray: 100,
                              strokeDashoffset: 100,
                              animation: "dash 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards 0.5s"
                            }}
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}

          {/* Locked Workspace Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <div 
              className="h-full rounded-3xl p-8 relative overflow-hidden group cursor-not-allowed"
              style={{
                background: "rgba(249, 250, 251, 0.3)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
              }}
            >
              {/* Lock Overlay */}
              <div 
                className="absolute inset-0 z-20 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: "rgba(255, 255, 255, 0.4)",
                  backdropFilter: "blur(2px)"
                }}
              >
                <Shield className="w-10 h-10 text-gray-800 mb-2" />
                <span className="text-sm font-bold text-gray-800 uppercase tracking-wider">Restricted Access</span>
              </div>

              {/* Content (grayed out) */}
              <div className="opacity-60">
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-gray-200 flex items-center justify-center text-gray-500 shadow-inner">
                    <Shield className="w-6 h-6" fill="currentColor" />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold bg-white/30 px-2 py-1 rounded-md text-gray-400 border border-white/40">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="relative z-10 mb-6">
                  <h3 
                    className="text-2xl font-bold text-gray-500 mb-1"
                    style={{ fontFamily: "Playfair Display, serif" }}
                  >
                    Legal & Compliance
                  </h3>
                  <p className="text-sm text-gray-400 line-clamp-1">
                    Confidential documents and reviews
                  </p>
                </div>

                <div className="space-y-3 relative z-10 opacity-50">
                  <div className="flex justify-between text-xs font-medium text-gray-400">
                    <span>Active Projects</span>
                    <span>--</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-400 w-[20%] rounded-full" />
                  </div>
                  <div className="pt-4 flex items-center justify-between border-t border-gray-100/50">
                    <div className="flex -space-x-2 grayscale opacity-50">
                      <img 
                        alt="Member" 
                        className="w-7 h-7 rounded-full border-2 border-white" 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCaAfwKRoXyqTqisuBbDeLNfsJMTgMnBqZpolQCs3M5wQDsCc2Dn5wneG5-UDVz7K8mt6PpS4nTNUVslzg837NuVuIm2FsHi-8mFcV62WvkUI4_GyqEblJU6zAEMemMHHT-CKZCP_RwTCd7WvkQ5TM3cWq5WkOEhfLdDFwfJuJnCpOP5cnD7JO42Mc_SUAhqA6lgon_OM-t-KckeHNeJYOJsP5KavB8bIdFcm7FKBtFhG-Uzz_XBXdYsN2TJ5K6iIKhUl6HJuA8YlI"
                      />
                    </div>
                    <div className="h-8 w-24 opacity-30">
                      <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 30">
                        <path d="M0,15 L100,15" fill="none" stroke="#9ca3af" strokeDasharray="4 4" strokeWidth="2" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <style>{`
        @keyframes gradientMove {
          0% { background-position: 0% 50% }
          50% { background-position: 100% 50% }
          100% { background-position: 0% 50% }
        }
        @keyframes dash {
          to { stroke-dashoffset: 0; }
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes settle {
          0% { letter-spacing: 0.05em; opacity: 0; }
          100% { letter-spacing: 0; opacity: 1; }
        }
      `}</style>

      {/* Workspace Creation Modal */}
      <WorkspaceCreationModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
        onCreateWorkspace={handleCreateWorkspace}
      />
    </div>
  );
}