import { motion } from "motion/react";
import { BookOpen, PlayCircle, HelpCircle, Search, ArrowRight, MessageCircle, Mail } from "lucide-react";
import { toast } from "sonner@2.0.3";

export function HelpScreen() {
  const handleStartChat = () => {
    toast.success("Opening chat support...", {
      description: "You'll be connected with our support team shortly."
    });
    // In a real app, this would open a chat widget
    window.open('https://help.kaal.app/chat', '_blank');
  };

  const handleEmailSupport = () => {
    window.location.href = 'mailto:support@kaal.app?subject=KAAL Support Request';
    toast.success("Opening email client...");
  };

  const helpCategories = [
    {
      id: 1,
      icon: BookOpen,
      title: "User Documentation",
      description: "Detailed guides on features, customization, and workflow optimization.",
      link: "Explore Docs",
      gradient: "from-blue-50/50",
      hoverColor: "group-hover:text-blue-900",
    },
    {
      id: 2,
      icon: PlayCircle,
      title: "Video Tutorials",
      description: "Step-by-step visual walkthroughs for getting started and advanced tips.",
      link: "Watch Videos",
      gradient: "from-purple-50/50",
      hoverColor: "group-hover:text-purple-900",
    },
    {
      id: 3,
      icon: HelpCircle,
      title: "FAQ & Knowledge Base",
      description: "Quick answers to common questions and troubleshooting advice.",
      link: "Find Answers",
      gradient: "from-orange-50/50",
      hoverColor: "group-hover:text-orange-900",
    },
  ];

  const popularTopics = [
    { label: "Workspace Setup", href: "#" },
    { label: "Billing", href: "#" },
    { label: "Shortcuts", href: "#" },
  ];

  return (
    <div className="h-full overflow-auto">
      {/* Header */}
      <div
        className="sticky top-0 z-10 border-b backdrop-blur-xl"
        style={{
          background: "rgba(255, 255, 255, 0.8)",
          borderColor: "rgba(255, 255, 255, 0.5)",
        }}
      >
        <div className="max-w-6xl mx-auto px-10 py-6">
          <div className="flex flex-col">
            <h1 className="text-sm font-semibold text-[#6B7280] tracking-wide uppercase mb-1">
              Support
            </h1>
            <p className="text-2xl font-serif text-[#111827] italic">Help &amp; Documentation</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-smooth">
        <div className="max-w-6xl mx-auto p-10 space-y-16">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-8"
          >
            <div className="space-y-4">
              <h2 className="text-5xl font-serif font-medium text-[#111827] tracking-tight">
                How can we help you?
              </h2>
              <p className="text-[#6B7280] text-lg font-light tracking-wide max-w-xl mx-auto">
                Search for guides, API documentation, or FAQs to get the most out of KAAL.
              </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-100 rounded-2xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
              <div
                className="relative rounded-2xl shadow-lg transition-all duration-300 focus-within:shadow-xl flex items-center p-2"
                style={{
                  background: "rgba(255, 255, 255, 0.85)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255, 255, 255, 1)",
                }}
              >
                <Search className="text-[#6B7280] ml-4 w-6 h-6" strokeWidth={2} />
                <input
                  className="w-full bg-transparent border-none focus:ring-0 text-[#111827] placeholder-gray-400 text-lg py-3 px-4 font-light focus:outline-none"
                  placeholder="Search for articles, topics, or keywords..."
                  type="text"
                />
                <div className="pr-2">
                  <kbd className="hidden sm:inline-block px-2 py-1 bg-gray-100 border border-gray-200 rounded-lg text-xs text-gray-500 font-sans shadow-sm">
                    ⌘ K
                  </kbd>
                </div>
              </div>
              <div className="flex justify-center gap-4 mt-4 text-sm text-[#6B7280]">
                <span className="opacity-60">Popular:</span>
                {popularTopics.map((topic) => (
                  <a
                    key={topic.label}
                    className="hover:text-[#111827] underline decoration-gray-300 underline-offset-4 decoration-1 hover:decoration-[#111827] transition-all"
                    href={topic.href}
                  >
                    {topic.label}
                  </a>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Help Categories */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {helpCategories.map((category, index) => (
              <motion.a
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.1, duration: 0.5 }}
                href="#"
                className="group rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-500 border cursor-pointer"
                style={{
                  background:
                    "linear-gradient(160deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.4) 100%)",
                  backdropFilter: "blur(12px)",
                  borderColor: "rgba(255, 255, 255, 0.5)",
                }}
              >
                <div className="h-full flex flex-col">
                  <div className="mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-white shadow-lg flex items-center justify-center relative overflow-hidden transition-transform duration-300 group-hover:scale-105">
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${category.gradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}
                      ></div>
                      <category.icon
                        className="text-[#111827] relative z-10 w-8 h-8"
                        strokeWidth={1.5}
                      />
                    </div>
                  </div>
                  <h3
                    className={`text-xl font-bold text-[#111827] mb-2 font-serif ${category.hoverColor} transition-colors`}
                  >
                    {category.title}
                  </h3>
                  <p className="text-[#6B7280] text-sm leading-relaxed mb-6 font-light">
                    {category.description}
                  </p>
                  <div className="mt-auto flex items-center text-sm font-semibold text-[#111827] group-hover:translate-x-1 transition-transform">
                    {category.link}{" "}
                    <ArrowRight className="w-4 h-4 ml-1" strokeWidth={2.5} />
                  </div>
                </div>
              </motion.a>
            ))}
          </div>

          {/* Contact Support Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="relative rounded-3xl overflow-hidden shadow-xl border"
            style={{
              background:
                "linear-gradient(160deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.4) 100%)",
              backdropFilter: "blur(12px)",
              borderColor: "rgba(255, 255, 255, 0.4)",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-black opacity-5"></div>
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-gray-200 rounded-full blur-3xl opacity-20"></div>
            <div className="relative z-10 p-10 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="max-w-lg">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111827]/5 border border-[#111827]/10 text-[#111827]/80 text-xs font-bold uppercase tracking-widest mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  Live Support
                </div>
                <h3 className="text-3xl font-serif font-medium text-[#111827] mb-3">
                  Still need assistance?
                </h3>
                <p className="text-[#6B7280] text-lg font-light leading-relaxed">
                  Our dedicated support team is available 24/7 to help you resolve complex
                  issues or answer specific account questions.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <button
                  className="bg-[#111827] hover:bg-gray-900 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 font-medium text-sm tracking-wide"
                  onClick={handleStartChat}
                >
                  <MessageCircle className="w-5 h-5" strokeWidth={2} />
                  Start Chat
                </button>
                <button
                  className="bg-white hover:bg-gray-50 text-[#111827] border border-gray-200 px-8 py-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center gap-3 font-medium text-sm tracking-wide"
                  onClick={handleEmailSupport}
                >
                  <Mail className="w-5 h-5" strokeWidth={2} />
                  Email Support
                </button>
              </div>
            </div>
          </motion.div>

          {/* Footer */}
          <div className="border-t border-gray-200/50 pt-10 pb-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-[#6B7280] opacity-60">
            <p>© 2026 KAAL Systems. All rights reserved.</p>
            <div className="flex gap-6">
              <a className="hover:text-[#111827] transition-colors" href="#">
                Privacy
              </a>
              <a className="hover:text-[#111827] transition-colors" href="#">
                Terms
              </a>
              <a className="hover:text-[#111827] transition-colors" href="#">
                Status
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}