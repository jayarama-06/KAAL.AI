import { motion } from "motion/react";
import {
  Share2,
  Mail,
  Send,
  Star,
  Copy,
  FolderOpen,
  Settings,
  Ban,
  RefreshCw,
  Trash2,
  Search,
  Filter,
  ArrowRight,
  Link as LinkIcon,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { copyToClipboard } from "../utils/clipboard";

export function ShareScreen() {
  const [emailTags, setEmailTags] = useState([
    { id: 1, email: "alex@kaal.design", initial: "A", color: "from-purple-400 to-indigo-500" },
    { id: 2, email: "mark@studio.io", initial: "M", color: "from-emerald-400 to-teal-500" },
  ]);
  const [newEmail, setNewEmail] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  const [sharedLinks, setSharedLinks] = useState([
    {
      id: 1,
      title: "Q4 Marketing Assets",
      status: "Active",
      statusColor: "green",
      icon: FolderOpen,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      iconBorder: "border-blue-100",
      createdAt: "2 days ago",
      views: 12,
      expires: "5 days",
      viewers: [
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBl7v5IWwLoWHkbqNKZe0A-HVMQZvoXUJatzUZZ5M4fq8f-h8LG0WFAfcjg1FjloOLwIHIRuZ9pF3f29iU6KAEu977nrNN7Y5PLd_GDxHP2tyojGWZA2CEgDLhWEnYnJSY39-cIxHPlvugofYyPjuU14Gi0QLEOCTsstQHRnqeul8WszHMTtfapcgLhuwtDgbMIE5Tbx17a0Hdnrj_gsVw05LgGU1wT8Z_7ITbU1X-vUbWVIR5sg4OPlQ68MRy-jeEXz0L7DHh5Az4",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBPkqBHVgLn1Jlwc_JzrP-4EyPGhRPQZ0a2XIYCX9q424Zm2rf0FPQzRN7-V6BCMdZgURQ81VJW_OTB7fn5lLx8bysg3dwLP0BwadyVcfMEi3AZpravZD2zATikyZdW9NRuy84bf8XJpG4enqTLcaITKgk9ll7JA9RYrTlg2TDXIMDyaBXMbOb23Kdh--pAELyVNizwcUZ9R0rb_ZH2_8OriPV2quy3UKt14u-GVngnAtLFTVi9vk1pSr_LQyGZQXCCmYSOmwTzeRo",
      ],
      viewerCount: 3,
      expired: false,
      passwordProtected: false,
    },
    {
      id: 2,
      title: "Wireframes - Project Phoenix",
      status: "Expired",
      statusColor: "gray",
      icon: FolderOpen,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
      iconBorder: "border-purple-100",
      createdAt: "1 week ago",
      views: 48,
      passwordProtected: true,
      viewers: [
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCu8Egar28nRsGJi8TWRQDbGc2SxdfL8HirFJ8Y6EmScM_LVB7Bw9hv_YII8y5J-QM41ct6SDh_R3d2v2Dd1bosG_RELiEKbyEWtKNCct4l0OpKueTSFy6vm6crQ-Tv87IO1J3xPhr9nosNZBh2XLYTkdeuBCH2cemoWHMx24RCKmI4STY4W7UTD03yDFhI-jQGi02z-YoJAsSJpjZdvgaYcgvs4ghpK-3XGi28uB8DFdRWjREAY4oUNoqXSvMq793wAmgpmK8_yRs",
      ],
      viewerCount: 0,
      expired: true,
      expires: undefined as string | undefined,
    },
  ]);

  const handleDeleteLink = (id: number) => {
    setSharedLinks(prev => prev.filter(l => l.id !== id));
    toast.success("Link deleted");
  };

  const handleCopyLink = (title: string) => {
    copyToClipboard(`https://kaal.work/share/${title.toLowerCase().replace(/\s+/g, '-')}`);
    toast.success(`Link for "${title}" copied!`);
  };

  const handleRefreshLink = (id: number) => {
    setSharedLinks(prev => prev.map(l => l.id === id ? { ...l, expired: false, status: "Active", statusColor: "green", expires: "30 days" } : l));
    toast.success("Link renewed for 30 days!");
  };

  const handleRevokeLink = (id: number) => {
    setSharedLinks(prev => prev.map(l => l.id === id ? { ...l, expired: true, status: "Revoked", statusColor: "gray" } : l));
    toast.success("Link access revoked");
  };

  const handleAddEmail = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newEmail.trim()) {
      setEmailTags(prev => [...prev, { id: Date.now(), email: newEmail.trim(), initial: newEmail[0].toUpperCase(), color: "from-purple-400 to-indigo-500" }]);
      setNewEmail("");
    }
  };

  const handleRemoveEmail = (id: number) => {
    setEmailTags(prev => prev.filter(tag => tag.id !== id));
  };

  const handleSendInvitations = () => {
    toast.success("Invitations sent!");
  };

  const handleCopyCode = () => {
    copyToClipboard("KAAL-8X92");
    setCopiedCode(true);
    toast.success("Referral code copied!");
  };

  const handleShareReferral = () => {
    copyToClipboard("https://kaal.work/referral/KAAL-8X92");
    toast.success("Referral link copied!");
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col" style={{ backgroundColor: "#F8F9FA" }}>
      {/* Header */}
      <header 
        className="h-24 border-b flex items-center justify-between px-10 sticky top-0 z-20"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderColor: "rgba(255, 255, 255, 0.5)",
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
        }}
      >
        <div className="flex flex-col">
          <h1 
            className="text-sm font-semibold tracking-wide uppercase"
            style={{ color: "#6B7280" }}
          >
            Collaboration
          </h1>
          <p 
            className="text-2xl italic"
            style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
          >
            Invite Team &amp; Share
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-10 scroll-smooth">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Hero */}
          <div className="flex justify-between items-end mb-4">
            <div>
              <motion.h2
                initial={{ opacity: 0, letterSpacing: "0.05em" }}
                animate={{ opacity: 1, letterSpacing: "0" }}
                transition={{ duration: 0.8 }}
                className="text-5xl font-medium tracking-tight leading-tight"
                style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
              >
                Grow your{" "}
                <span 
                  className="italic text-transparent bg-clip-text bg-gradient-to-r"
                  style={{
                    backgroundImage: "linear-gradient(to right, #111827, #6B7280)"
                  }}
                >
                  Circle.
                </span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="mt-3 text-lg font-light tracking-wide max-w-lg"
                style={{ color: "#6B7280" }}
              >
                Seamlessly collaborate with your team or share progress externally.
              </motion.p>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-12 gap-8">
            {/* Invite Team Members - Left Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="col-span-12 lg:col-span-8 rounded-3xl p-8 border"
              style={{
                background: "linear-gradient(160deg, rgba(255, 255, 255, 0.65) 0%, rgba(255, 255, 255, 0.4) 100%)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                borderColor: "rgba(255, 255, 255, 0.5)",
                boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)"
              }}
            >
              <div 
                className="flex items-center justify-between mb-8 pb-6"
                style={{
                  borderBottom: "1px solid rgba(243, 244, 246, 0.5)"
                }}
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center border"
                    style={{
                      backgroundColor: "rgba(17, 24, 39, 0.05)",
                      borderColor: "rgba(17, 24, 39, 0.1)",
                      color: "#111827"
                    }}
                  >
                    <Mail className="w-6 h-6" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 
                      className="text-xl font-medium"
                      style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
                    >
                      Invite Team Members
                    </h3>
                    <p className="text-sm" style={{ color: "#6B7280" }}>
                      Add emails to send invitations to your workspace.
                    </p>
                  </div>
                </div>
                <span 
                  className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm flex items-center gap-1.5"
                  style={{
                    backgroundColor: "rgba(240, 253, 244, 1)",
                    color: "#15803d",
                    borderColor: "rgba(187, 247, 208, 1)"
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  Unlimited Seats
                </span>
              </div>

              <div className="space-y-6">
                {/* Email Input */}
                <div className="relative group">
                  <label 
                    className="block text-xs font-bold uppercase tracking-widest mb-2 ml-1"
                    style={{ color: "#6B7280" }}
                  >
                    Email Addresses
                  </label>
                  <div 
                    className="w-full min-h-[60px] p-2 border rounded-xl focus-within:ring-2 transition-all flex flex-wrap gap-2 items-center"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.4)",
                      borderColor: "rgba(255, 255, 255, 0.6)",
                      boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.05)"
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "rgba(17, 24, 39, 0.2)";
                      e.currentTarget.style.boxShadow = "0 0 0 2px rgba(17, 24, 39, 0.1), inset 0 1px 2px rgba(0, 0, 0, 0.05)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.6)";
                      e.currentTarget.style.boxShadow = "inset 0 1px 2px rgba(0, 0, 0, 0.05)";
                    }}
                  >
                    {emailTags.map((tag, index) => (
                      <motion.div
                        key={tag.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white border rounded-lg"
                        style={{
                          borderColor: "#E5E7EB",
                          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                        }}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-gradient-to-br ${tag.color} flex items-center justify-center text-[10px] text-white font-bold`}
                        >
                          {tag.initial}
                        </div>
                        <span className="text-sm font-medium" style={{ color: "#111827" }}>
                          {tag.email}
                        </span>
                        <button className="text-gray-400 hover:text-red-500 transition-colors ml-1" onClick={() => handleRemoveEmail(tag.id)}>
                          <Plus className="w-4 h-4 rotate-45" strokeWidth={2} />
                        </button>
                      </motion.div>
                    ))}
                    <input
                      className="flex-1 bg-transparent border-none focus:ring-0 text-sm min-w-[150px] outline-none"
                      style={{ color: "#111827" }}
                      placeholder="Enter email address..."
                      type="text"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      onKeyDown={handleAddEmail}
                    />
                  </div>
                  <div className="absolute right-3 top-[38px] opacity-0 group-focus-within:opacity-100 transition-opacity">
                    <kbd 
                      className="hidden sm:inline-block px-2 py-0.5 border rounded text-[10px] font-mono"
                      style={{
                        backgroundColor: "#F3F4F6",
                        borderColor: "#E5E7EB",
                        color: "#6B7280"
                      }}
                    >
                      Enter
                    </kbd>
                  </div>
                </div>

                {/* Role and Access Dropdowns */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label 
                      className="block text-xs font-bold uppercase tracking-widest mb-2 ml-1"
                      style={{ color: "#6B7280" }}
                    >
                      Role
                    </label>
                    <select 
                      className="w-full border rounded-xl px-4 py-3 text-sm appearance-none focus:ring-2 shadow-sm cursor-pointer transition-colors"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.4)",
                        borderColor: "rgba(255, 255, 255, 0.6)",
                        color: "#111827"
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.6)";
                        e.currentTarget.style.borderColor = "rgba(17, 24, 39, 0.2)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.4)";
                        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.6)";
                      }}
                    >
                      <option>Editor</option>
                      <option>Viewer</option>
                      <option>Admin</option>
                    </select>
                  </div>
                  <div>
                    <label 
                      className="block text-xs font-bold uppercase tracking-widest mb-2 ml-1"
                      style={{ color: "#6B7280" }}
                    >
                      Project Access
                    </label>
                    <select 
                      className="w-full border rounded-xl px-4 py-3 text-sm appearance-none focus:ring-2 shadow-sm cursor-pointer transition-colors"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.4)",
                        borderColor: "rgba(255, 255, 255, 0.6)",
                        color: "#111827"
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.6)";
                        e.currentTarget.style.borderColor = "rgba(17, 24, 39, 0.2)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.4)";
                        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.6)";
                      }}
                    >
                      <option>All Projects</option>
                      <option>Current Workspace Only</option>
                      <option>Selected Folders</option>
                    </select>
                  </div>
                </div>

                {/* Send Button */}
                <div className="pt-4 flex justify-end">
                  <button 
                    className="px-8 py-3 rounded-xl text-white flex items-center gap-2 font-medium group text-sm transition-all duration-300 transform hover:scale-[1.02] active:scale-95"
                    style={{
                      backgroundColor: "#111827",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255,255,255,0.1)"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#1F2937";
                      e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#111827";
                      e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255,255,255,0.1)";
                    }}
                    onClick={handleSendInvitations}
                  >
                    Send Invitations
                    <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={2} />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Premium Referral Card - Right Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="col-span-12 lg:col-span-4 rounded-3xl p-1 overflow-hidden transition-all duration-500 group flex flex-col"
              style={{
                background: "linear-gradient(160deg, rgba(255, 255, 255, 0.65) 0%, rgba(255, 255, 255, 0.4) 100%)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)"
              }}
            >
              <div 
                className="relative h-full rounded-[20px] p-8 text-white flex flex-col justify-between overflow-hidden"
                style={{
                  background: "linear-gradient(to bottom, rgba(17, 24, 39, 0.95), rgba(31, 41, 55, 1))"
                }}
              >
                <div 
                  className="absolute top-0 right-0 w-64 h-64 rounded-full mix-blend-overlay filter blur-[60px] opacity-20 animate-pulse"
                  style={{ backgroundColor: "#a855f7" }}
                ></div>
                <div 
                  className="absolute bottom-0 left-0 w-48 h-48 rounded-full mix-blend-overlay filter blur-[50px] opacity-20"
                  style={{ 
                    backgroundColor: "#3b82f6",
                    animationDelay: "1s"
                  }}
                ></div>

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center border"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        backdropFilter: "blur(12px)",
                        borderColor: "rgba(255, 255, 255, 0.1)",
                        boxShadow: "0 0 15px rgba(0, 0, 0, 0.1)"
                      }}
                    >
                      <Star className="w-5 h-5 text-yellow-400" fill="#fbbf24" strokeWidth={2} />
                    </div>
                    <span 
                      className="text-xs font-bold uppercase tracking-widest border px-2 py-1 rounded-md"
                      style={{
                        backgroundImage: "linear-gradient(to right, #fcd34d, #f59e0b)",
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        color: "transparent",
                        borderColor: "rgba(234, 179, 8, 0.3)",
                        backgroundColor: "rgba(255, 255, 255, 0.05)"
                      }}
                    >
                      Premium
                    </span>
                  </div>
                  <h3 
                    className="text-2xl font-light mb-2"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>Refer a</span> <br />
                    <span className="font-bold italic" style={{ color: "#FFFFFF" }}>Professional</span>
                  </h3>
                  <p className="text-sm font-light leading-relaxed mb-8" style={{ color: "#D1D5DB" }}>
                    Give 2 months of Premium, get 1 month free when they subscribe.
                  </p>
                </div>

                <div className="relative z-10 mt-auto">
                  <div 
                    className="rounded-xl p-4 mb-4 flex items-center justify-between group-hover:bg-white/15 transition-colors cursor-pointer border"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      backdropFilter: "blur(12px)",
                      borderColor: "rgba(255, 255, 255, 0.1)"
                    }}
                  >
                    <div className="flex flex-col">
                      <span 
                        className="text-[10px] uppercase tracking-widest font-bold"
                        style={{ color: "#9CA3AF" }}
                      >
                        Your Code
                      </span>
                      <span className="font-mono text-lg tracking-wider text-white">
                        KAAL-8X92
                      </span>
                    </div>
                    <button 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white transition-colors"
                      style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                      onClick={handleCopyCode}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                      }}
                    >
                      <Copy className="w-4 h-4" strokeWidth={2} />
                    </button>
                  </div>
                  <button 
                    className="w-full py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: "#FFFFFF",
                      color: "#111827",
                      boxShadow: "0 0 15px rgba(0, 0, 0, 0.1)"
                    }}
                    onClick={handleShareReferral}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#F3F4F6";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#FFFFFF";
                    }}
                  >
                    Share Referral Link
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Collaboration Links Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="col-span-12 rounded-3xl p-8 border"
              style={{
                background: "linear-gradient(160deg, rgba(255, 255, 255, 0.65) 0%, rgba(255, 255, 255, 0.4) 100%)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                borderColor: "rgba(255, 255, 255, 0.6)",
                boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)"
              }}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                  <h3 
                    className="text-xl font-medium"
                    style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
                  >
                    Collaboration Links
                  </h3>
                  <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
                    Manage secure links shared externally.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search 
                      className="absolute left-3 top-2.5 w-[18px] h-[18px]" 
                      strokeWidth={2} 
                      style={{ color: "#6B7280" }}
                    />
                    <input
                      className="pl-9 pr-4 py-2 border rounded-xl text-sm outline-none w-64 shadow-sm"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.5)",
                        borderColor: "rgba(255, 255, 255, 0.8)",
                        color: "#111827"
                      }}
                      placeholder="Search links..."
                      type="text"
                      onFocus={(e) => {
                        e.currentTarget.style.boxShadow = "0 0 0 2px rgba(17, 24, 39, 0.1)";
                        e.currentTarget.style.borderColor = "rgba(17, 24, 39, 0.2)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.boxShadow = "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
                        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.8)";
                      }}
                    />
                  </div>
                  <button 
                    className="px-4 py-2 border rounded-xl shadow-sm text-sm font-medium transition-colors flex items-center gap-2"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.8)",
                      borderColor: "#FFFFFF",
                      color: "#111827"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#FFFFFF";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
                    }}
                  >
                    <Filter className="w-[18px] h-[18px]" strokeWidth={2} />
                    Filter
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {sharedLinks.map((link, index) => (
                  <motion.div
                    key={link.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex items-center p-4 border rounded-2xl transition-all duration-300 group"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.4)",
                      borderColor: "rgba(255, 255, 255, 0.8)"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.6)";
                      e.currentTarget.style.boxShadow = "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.4)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl ${link.iconBg} ${link.iconColor} flex items-center justify-center border ${link.iconBorder} mr-4 shadow-sm group-hover:scale-105 transition-transform`}
                    >
                      <link.icon className="w-5 h-5" fill="currentColor" strokeWidth={0} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold truncate" style={{ color: "#111827" }}>{link.title}</h4>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            link.statusColor === "green"
                              ? "bg-green-100/60 text-green-700 border border-green-200"
                              : "bg-gray-100/60 text-gray-600 border border-gray-200"
                          }`}
                        >
                          {link.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs" style={{ color: "#6B7280" }}>
                        <span className="flex items-center gap-1">
                          Created {link.createdAt}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                        <span className="flex items-center gap-1 font-medium" style={{ color: "#111827" }}>
                          {link.views} views
                        </span>
                        {link.expires && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                            <span className="flex items-center gap-1">
                              Expires in {link.expires}
                            </span>
                          </>
                        )}
                        {link.passwordProtected && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                            <span className="flex items-center gap-1">Password Protected</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div 
                      className="flex items-center gap-6 px-4 mx-4"
                      style={{ borderLeft: "1px solid rgba(229, 231, 235, 0.5)" }}
                    >
                      <div className={`flex -space-x-2 ${link.expired ? "grayscale opacity-60" : ""}`}>
                        {link.viewers.map((viewer, i) => (
                          <img
                            key={i}
                            alt="Viewer"
                            className="w-7 h-7 rounded-full border-2 border-white"
                            src={viewer}
                          />
                        ))}
                        {link.viewerCount > 0 && (
                          <div 
                            className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold"
                            style={{
                              backgroundColor: "#F3F4F6",
                              color: "#6B7280"
                            }}
                          >
                            +{link.viewerCount}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      {link.expired ? (
                        <button
                          className="p-2 rounded-lg transition-colors border border-transparent"
                          style={{ color: "#6B7280" }}
                          title="Refresh"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#FFFFFF";
                            e.currentTarget.style.color = "#111827";
                            e.currentTarget.style.borderColor = "#F3F4F6";
                            e.currentTarget.style.boxShadow = "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.color = "#6B7280";
                            e.currentTarget.style.borderColor = "transparent";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                          onClick={() => handleRefreshLink(link.id)}
                        >
                          <RefreshCw className="w-5 h-5" strokeWidth={2} />
                        </button>
                      ) : (
                        <button
                          className="p-2 rounded-lg transition-colors border border-transparent"
                          style={{ color: "#6B7280" }}
                          title="Copy Link"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#FFFFFF";
                            e.currentTarget.style.color = "#111827";
                            e.currentTarget.style.borderColor = "#F3F4F6";
                            e.currentTarget.style.boxShadow = "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.color = "#6B7280";
                            e.currentTarget.style.borderColor = "transparent";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                          onClick={() => handleCopyLink(link.title)}
                        >
                          <LinkIcon className="w-5 h-5" strokeWidth={2} />
                        </button>
                      )}
                      <button
                        className="p-2 rounded-lg transition-colors border border-transparent"
                        style={{ color: "#6B7280" }}
                        title="Settings"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#FFFFFF";
                          e.currentTarget.style.color = "#111827";
                          e.currentTarget.style.borderColor = "#F3F4F6";
                          e.currentTarget.style.boxShadow = "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "#6B7280";
                          e.currentTarget.style.borderColor = "transparent";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <Settings className="w-5 h-5" strokeWidth={2} />
                      </button>
                      <button
                        className="p-2 rounded-lg transition-colors border border-transparent"
                        style={{ color: "#6B7280" }}
                        title={link.expired ? "Delete" : "Revoke"}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#FEF2F2";
                          e.currentTarget.style.color = "#DC2626";
                          e.currentTarget.style.borderColor = "#FEE2E2";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "#6B7280";
                          e.currentTarget.style.borderColor = "transparent";
                        }}
                        onClick={() => link.expired ? handleDeleteLink(link.id) : handleRevokeLink(link.id)}
                      >
                        {link.expired ? (
                          <Trash2 className="w-5 h-5" strokeWidth={2} />
                        ) : (
                          <Ban className="w-5 h-5" strokeWidth={2} />
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div 
                className="mt-6 pt-4 flex justify-center"
                style={{ borderTop: "1px solid rgba(243, 244, 246, 0.5)" }}
              >
                <button 
                  className="text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 py-2 px-4 rounded-lg"
                  style={{ color: "#6B7280" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#111827";
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#6B7280";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  View Archived Links
                  <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
        <div className="h-24"></div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-10 right-10 z-50">
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, type: "spring" }}
          className="text-white rounded-full px-8 py-4 flex items-center gap-3 transition-all duration-500 hover:scale-105 active:scale-95 group ring-1"
          style={{
            backgroundColor: "rgba(17, 24, 39, 0.9)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            ringColor: "rgba(255, 255, 255, 0.2)",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#000000";
            e.currentTarget.style.boxShadow = "0 0 30px rgba(17, 24, 39, 0.3), 0 0 60px rgba(17, 24, 39, 0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(17, 24, 39, 0.9)";
            e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
          }}
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" strokeWidth={2.5} />
          <span className="font-bold tracking-wide text-xs uppercase">New Quick Link</span>
        </motion.button>
      </div>
    </div>
  );
}