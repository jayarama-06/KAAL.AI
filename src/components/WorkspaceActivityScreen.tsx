import { motion } from "motion/react";
import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { 
  LayoutDashboard, 
  TrendingUp, 
  CheckCircle2, 
  Megaphone, 
  Terminal,
  MoreHorizontal,
  Brain,
  ArrowLeft
} from "lucide-react";

export function ProjectOverviewScreen() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const projects = [
    {
      id: 1,
      name: "Project Phoenix",
      subtitle: "UI Design System",
      status: "Active",
      statusColor: "blue",
      icon: LayoutDashboard,
      totalTime: { hours: 12, minutes: 40 },
      completion: 85,
      activities: [
        { name: "Deep Work", time: "4h 20m", percentage: 65, color: "bg-blue-600" },
        { name: "Meetings", time: "1h 15m", percentage: 25, color: "bg-indigo-400" },
        { name: "Research", time: "2h 05m", percentage: 45, color: "bg-cyan-400" }
      ],
      members: [
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAvMr2ckmALhAmY-nlphdz5_1g-W4nSwmTD3XQAZ7bXuPZrCROdjRexpspaVU2A5WL-nrLfIoVxlw-YD8FPzxohwaMBGYpJDJ78M8G80Z-VYFj7Vk11uo-5Lyhe77wLfrfukWlWEyqro8BlxR0FrMtL8rQkmS1EpaAf0v5pwK4H8R0KHfVufV9eNIAfDjxf6o0BnteqveLDxLiKtehgltZEv4-7-Nxb3NAbdbTe0kmC_1ZPiufMkq-EIoBtcHsQTMB_L0TijSkqBAU",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCaAfwKRoXyqTqisuBbDeLNfsJMTgMnBqZpolQCs3M5wQDsCc2Dn5wneG5-UDVz7K8mt6PpS4nTNUVslzg837NuVuIm2FsHi-8mFcV62WvkUI4_GyqEblJU6zAEMemMHHT-CKZCP_RwTCd7WvkQ5TM3cWq5WkOEhfLdDFwfJuJnCpOP5cnD7JO42Mc_SUAhqA6lgon_OM-t-KckeHNeJYOJsP5KavB8bIdFcm7FKBtFhG-Uzz_XBXdYsN2TJ5K6iIKhUl6HJuA8YlI",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAN63VPamqK4EUd_btHTsZ9WJhkJDQDRLjxIRAewLBTp10e45t19ZQezN5Tl_Gzpk8pL2-ezVCNpJ5-EI-8QMnPtZ0VzCCpjteyezCUjZEJoUMLX-pQ96gBBTFnVBfQXK45na0P0NQfG-amUPvg1abuiLb6WdOE8Acu5bDBygvrkHO2Bz0UuuevwBHFxsJYY8UBBAfqv6E2YNDpz6Oj1j5yn3WWRW20IjS8eiyhEA0uTx-NayOlZj6vhQHB0Q-KgnUARrzn1c2i5Ew"
      ],
      additionalContributors: 4
    }
  ];

  const smallProjects = [
    {
      id: 2,
      name: "Q4 Campaign",
      subtitle: "Marketing Strategy",
      status: "Review",
      statusColor: "orange",
      icon: Megaphone,
      time: "3h 45m",
      members: [
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDnRIQQFUk7sXrUrvG5brZonDUmI1uHaDRiEqXk0KDj4tmXUXfopgF0JWLa3jyXwDqSjJhk8joyuG6MPR-5367ggc3GqFsNiVHd-c1I_bJr6hydjGoBIQd6MYM-Pkx2GtBzAxPSZLeIgNbqDjFUSUx35VM0-HpYU-0JvAa1Ov92-fyUbZcXh2SSJmZPQNz4J_1Ir4M4-m4PZR5zP3YyWtd_XgB9ChvLLmcVyXsaCXk3zxaxQ7MKX7V96l3E_RpWXu5MePWcdgj1DE8",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCXWuEOy5TvqMUKmavY_CdaLE3OmDz0RUAMipb2g1nMICred0JAI-h7pgF-WJs12GZEyWzrZNyprYqsKca-L2Ond5kfrCgbIhlqPD7ppoUGuY5QCWVqwxbzX9lvNUXqlPtwmFl1BJMN6S7KDBlxAOssUEFUmJtAw9DUq1iuziz4mQ3HPVRD3FnlLMfFbWJSNDC9dJNe0DrHaTKd4XKDTHnv2FhmXTi_E3T7q-WYNwUtL--_LDQxaQB049WVKXEa0dxIVKqwDYH3ygQ"
      ]
    },
    {
      id: 3,
      name: "Internal Tools",
      subtitle: "Maintenance",
      status: "Backlog",
      statusColor: "slate",
      icon: Terminal,
      time: "1h 10m",
      members: [
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCngjfsdqfomXvbRvK8TfB0txMGNmijVG3D0wytlNfACpevA6lRKZib-nJfQBx9QptMeM7oZbv9orblmEy5xM4gMSTwG7v_EFMa9OeRolkV4hnkbUhAxejRit7JMT8y496nNPrJSF9_qqRj2KzMWNk8blQc8lVX79406ZvpWjNdJVBmWqLdqb84eQsUU9aXShiovWw4TJ7YwjzYgo7rLsRfMaU3DbHiAh6k_zxFC8t5cAFj2z_3UYtcppgn4Hg2JaQ-eO6BnZzCEiw"
      ]
    }
  ];

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
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/workspace")}
            className="p-2 rounded-lg transition-all duration-300 hover:bg-white/60"
            style={{ color: "#6B7280" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#111827";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#6B7280";
            }}
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2} />
          </button>
          <div className="flex flex-col">
            <h1 
              className="text-sm font-semibold tracking-wide uppercase"
              style={{ color: "#6B7280" }}
            >
              Workspace
            </h1>
            <p 
              className="text-2xl italic"
              style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
            >
              Deep Dive Activity
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div 
            className="flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.6)",
              borderColor: "rgba(255, 255, 255, 0.8)",
              backdropFilter: "blur(4px)"
            }}
          >
            <span className="text-lg">🔥</span>
            <span className="text-xs font-bold tracking-wide" style={{ color: "#111827" }}>
              3 DAY STREAK
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-10 scroll-smooth">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="flex justify-between items-end">
            <div>
              <motion.h2
                initial={{ opacity: 0, letterSpacing: "0.05em" }}
                animate={{ opacity: 1, letterSpacing: "0" }}
                transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }}
                className="text-4xl font-medium tracking-tight leading-tight"
                style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
              >
                Project Overview
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="mt-2 text-lg font-light tracking-wide max-w-lg"
                style={{ color: "#6B7280" }}
              >
                Detailed breakdown of time distribution and focus blocks across active projects.
              </motion.p>
            </div>
            <div className="flex gap-3">
              <button 
                className="px-5 py-2.5 rounded-lg shadow-sm border text-sm font-medium flex items-center gap-2 transition-all"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.6)",
                  borderColor: "rgba(255, 255, 255, 0.6)",
                  color: "#111827"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#FFFFFF";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.6)";
                }}
              >
                📅 This Week
              </button>
              <button 
                className="px-5 py-2.5 rounded-lg shadow-sm border text-sm font-medium flex items-center gap-2 transition-all"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.6)",
                  borderColor: "rgba(255, 255, 255, 0.6)",
                  color: "#111827"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#FFFFFF";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.6)";
                }}
              >
                🎚️ Filter
              </button>
            </div>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[minmax(180px,auto)]">
            {/* Main Project Card - Large */}
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                className="col-span-1 md:col-span-2 row-span-2 rounded-3xl p-8 border cursor-pointer transition-all duration-300"
                style={{
                  background: "linear-gradient(160deg, rgba(255, 255, 255, 0.55) 0%, rgba(255, 255, 255, 0.4) 100%)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  borderColor: "rgba(255, 255, 255, 0.4)",
                  boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px) scale(1.01)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0) scale(1)";
                }}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-xl border flex items-center justify-center shadow-sm"
                      style={{
                        backgroundColor: "#EFF6FF",
                        borderColor: "#DBEAFE",
                        color: "#2563eb"
                      }}
                    >
                      <project.icon className="w-6 h-6" strokeWidth={2} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold" style={{ color: "#111827" }}>
                        {project.name}
                      </h3>
                      <p className="text-sm" style={{ color: "#6B7280" }}>
                        {project.subtitle}
                      </p>
                    </div>
                  </div>
                  <span 
                    className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border"
                    style={{
                      backgroundColor: "#EFF6FF",
                      color: "#2563eb",
                      borderColor: "#DBEAFE"
                    }}
                  >
                    {project.status}
                  </span>
                </div>

                <div className="flex gap-8 mb-8">
                  <div>
                    <div className="text-4xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}>
                      {project.totalTime.hours}
                      <span className="text-lg font-normal ml-1" style={{ fontFamily: "Inter, sans-serif", color: "#6B7280" }}>h</span>
                      {" "}
                      {project.totalTime.minutes}
                      <span className="text-lg font-normal ml-1" style={{ fontFamily: "Inter, sans-serif", color: "#6B7280" }}>m</span>
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: "#6B7280" }}>
                      Total Time
                    </div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}>
                      {project.completion}
                      <span className="text-lg font-normal ml-1" style={{ fontFamily: "Inter, sans-serif", color: "#6B7280" }}>%</span>
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: "#6B7280" }}>
                      Task Completion
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {project.activities.map((activity, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between text-xs font-medium" style={{ color: "#6B7280" }}>
                        <span>{activity.name}</span>
                        <span>{activity.time}</span>
                      </div>
                      <div 
                        className="h-2 w-full rounded-full overflow-hidden"
                        style={{ backgroundColor: "#F3F4F6" }}
                      >
                        <div 
                          className={`h-full rounded-full ${activity.color}`}
                          style={{ 
                            width: `${activity.percentage}%`,
                            boxShadow: activity.color === "bg-blue-600" ? "0 0 10px rgba(37,99,235,0.3)" : "none"
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {project.members.map((member, idx) => (
                      <img
                        key={idx}
                        alt="Member"
                        className="w-8 h-8 rounded-full border-2 border-white"
                        src={member}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium pl-2" style={{ color: "#6B7280" }}>
                    +{project.additionalContributors} contributors
                  </span>
                </div>
              </motion.div>
            ))}

            {/* Deep Focus Average */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="col-span-1 rounded-3xl p-6 border flex flex-col justify-between cursor-pointer transition-all duration-300"
              style={{
                background: "linear-gradient(160deg, rgba(255, 255, 255, 0.55) 0%, rgba(255, 255, 255, 0.4) 100%)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                borderColor: "rgba(255, 255, 255, 0.4)",
                boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div className="flex justify-between items-start">
                <div 
                  className="w-10 h-10 rounded-lg border flex items-center justify-center"
                  style={{
                    backgroundColor: "#FAF5FF",
                    borderColor: "#E9D5FF",
                    color: "#9333ea"
                  }}
                >
                  <Brain className="w-5 h-5" strokeWidth={2} />
                </div>
                <span className="text-xs font-bold flex items-center gap-1" style={{ color: "#16a34a" }}>
                  <TrendingUp className="w-4 h-4" strokeWidth={2} />
                  +12%
                </span>
              </div>
              <div className="mt-4">
                <h4 className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}>
                  4.2<span className="text-lg font-normal ml-1" style={{ fontFamily: "Inter, sans-serif", color: "#6B7280" }}>h</span>
                </h4>
                <p className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: "#6B7280" }}>
                  Deep Focus Avg
                </p>
              </div>
              <div className="mt-4 h-10 flex items-end gap-1">
                {[40, 60, 30, 80, 50].map((height, idx) => (
                  <div
                    key={idx}
                    className="w-full rounded-sm transition-all"
                    style={{
                      height: `${height}%`,
                      backgroundColor: height >= 70 ? "#9333ea" : height >= 50 ? "#a855f7" : height >= 40 ? "#c084fc" : "#e9d5ff"
                    }}
                  ></div>
                ))}
              </div>
            </motion.div>

            {/* Tasks Done */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="col-span-1 rounded-3xl p-6 border flex flex-col justify-between cursor-pointer transition-all duration-300"
              style={{
                background: "linear-gradient(160deg, rgba(255, 255, 255, 0.55) 0%, rgba(255, 255, 255, 0.4) 100%)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                borderColor: "rgba(255, 255, 255, 0.4)",
                boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div className="flex justify-between items-start">
                <div 
                  className="w-10 h-10 rounded-lg border flex items-center justify-center"
                  style={{
                    backgroundColor: "#ECFDF5",
                    borderColor: "#A7F3D0",
                    color: "#059669"
                  }}
                >
                  <CheckCircle2 className="w-5 h-5" strokeWidth={2} />
                </div>
                <span className="text-xs font-bold" style={{ color: "#6B7280" }}>
                  Today
                </span>
              </div>
              <div className="mt-4">
                <h4 className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}>
                  18<span className="text-lg font-normal ml-1" style={{ fontFamily: "Inter, sans-serif", color: "#6B7280" }}>/24</span>
                </h4>
                <p className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: "#6B7280" }}>
                  Tasks Done
                </p>
              </div>
              <div className="mt-4 relative h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#F3F4F6" }}>
                <div 
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ 
                    backgroundColor: "#10b981",
                    width: "75%",
                    boxShadow: "0 0 10px rgba(16,185,129,0.3)"
                  }}
                ></div>
              </div>
            </motion.div>

            {/* Small Project Cards */}
            {smallProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                className="col-span-1 rounded-3xl p-6 border relative overflow-hidden group cursor-pointer transition-all duration-300"
                style={{
                  background: "linear-gradient(160deg, rgba(255, 255, 255, 0.55) 0%, rgba(255, 255, 255, 0.4) 100%)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  borderColor: "rgba(255, 255, 255, 0.4)",
                  boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <project.icon className="w-16 h-16" strokeWidth={1} />
                </div>
                <div className="flex flex-col h-full justify-between relative z-10">
                  <div 
                    className="w-10 h-10 rounded-lg border flex items-center justify-center mb-4"
                    style={{
                      backgroundColor: project.statusColor === "orange" ? "#FFF7ED" : "#F8FAFC",
                      borderColor: project.statusColor === "orange" ? "#FED7AA" : "#E2E8F0",
                      color: project.statusColor === "orange" ? "#ea580c" : "#475569"
                    }}
                  >
                    <project.icon className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: "#111827" }}>
                      {project.name}
                    </h3>
                    <p className="text-xs mb-3" style={{ color: "#6B7280" }}>
                      {project.subtitle}
                    </p>
                    <div className="flex items-center gap-2 mb-4">
                      <span 
                        className="px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider"
                        style={{
                          backgroundColor: project.statusColor === "orange" ? "#FFF7ED" : "#F8FAFC",
                          color: project.statusColor === "orange" ? "#c2410c" : "#475569",
                          borderColor: project.statusColor === "orange" ? "#FED7AA" : "#E2E8F0"
                        }}
                      >
                        {project.status}
                      </span>
                    </div>
                  </div>
                  <div 
                    className="flex items-center justify-between mt-2 pt-4"
                    style={{ borderTop: "1px solid rgba(229, 231, 235, 1)" }}
                  >
                    <div className="text-sm font-bold" style={{ color: "#111827" }}>
                      {project.time}
                    </div>
                    <div className="flex -space-x-2">
                      {project.members.map((member, idx) => (
                        <img
                          key={idx}
                          alt="Member"
                          className="w-6 h-6 rounded-full border border-white"
                          src={member}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Activity Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="col-span-1 md:col-span-2 rounded-3xl p-8 border flex flex-col justify-between cursor-pointer transition-all duration-300"
              style={{
                background: "linear-gradient(160deg, rgba(255, 255, 255, 0.55) 0%, rgba(255, 255, 255, 0.4) 100%)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                borderColor: "rgba(255, 255, 255, 0.4)",
                boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold" style={{ color: "#111827" }}>
                  Activity Distribution
                </h3>
                <button style={{ color: "#6B7280" }} className="hover:text-primary">
                  <MoreHorizontal className="w-5 h-5" strokeWidth={2} />
                </button>
              </div>
              <div className="flex-1 flex items-end justify-between gap-2 h-32 w-full px-2">
                {[30, 50, 70, 90, 40, 65, 80, 20].map((height, idx) => {
                  const colors = ["#F3F4F6", "#F3F4F6", "#BFDBFE", "#3b82f6", "#F3F4F6", "#93C5FD", "#60A5FA", "#F3F4F6"];
                  const times = ["9am", "10am", "11am", "12pm", "1pm", "2pm", "3pm", "4pm"];
                  return (
                    <div 
                      key={idx}
                      className="w-full rounded-t-sm transition-all relative group"
                      style={{
                        height: `${height}%`,
                        backgroundColor: colors[idx],
                        boxShadow: height === 90 ? "0 0 15px rgba(59,130,246,0.3)" : "none"
                      }}
                    >
                      <div 
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-white"
                        style={{ backgroundColor: "#111827" }}
                      >
                        {times[idx]}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mt-2 px-1" style={{ color: "#6B7280" }}>
                <span>9am</span>
                <span>12pm</span>
                <span>4pm</span>
              </div>
            </motion.div>

            {/* Focus Score */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="col-span-1 md:col-span-2 rounded-3xl p-8 border flex items-center justify-between cursor-pointer transition-all duration-300"
              style={{
                background: "linear-gradient(160deg, rgba(255, 255, 255, 0.55) 0%, rgba(255, 255, 255, 0.4) 100%)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                borderColor: "rgba(255, 255, 255, 0.4)",
                boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div>
                <h3 className="text-xl font-bold mb-1" style={{ color: "#111827" }}>
                  Focus Score
                </h3>
                <p className="text-sm" style={{ color: "#6B7280" }}>
                  Compared to yesterday
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-4xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}>
                    82
                  </div>
                  <div className="text-xs font-bold uppercase tracking-widest mt-1 flex items-center justify-end gap-1" style={{ color: "#16a34a" }}>
                    <span>↑</span> Top 10%
                  </div>
                </div>
                <div className="h-16 w-16 relative">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="#E5E7EB"
                      strokeWidth="4"
                      fill="none"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="#111827"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray="175"
                      strokeDashoffset="35"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}