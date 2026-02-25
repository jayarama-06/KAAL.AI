import { motion } from "motion/react";
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2,
  Bold,
  Italic,
  List,
  Mic
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner@2.0.3";
import { MeetingCreationModal, MeetingData } from "./MeetingCreationModal";

export function MeetingsScreen() {
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({
    item1: true,
    item2: true,
    item3: false,
    item4: false,
  });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [textFormat, setTextFormat] = useState({
    bold: false,
    italic: false,
    list: false
  });
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [meetings, setMeetings] = useState([
    {
      id: 1,
      time: "09:00 AM - 10:00 AM",
      title: "Q4 Strategy Sync",
      location: "Executive Boardroom • In-person",
      status: "Live",
      statusColor: "green",
      isLive: true,
      attendees: 7,
      date: new Date().toISOString().split('T')[0],
      startTime: "09:00",
      endTime: "10:00"
    },
    {
      id: 2,
      time: "11:30 AM - 12:30 PM",
      title: "Product Roadmap Review",
      location: "Online • Zoom Link",
      status: "Upcoming",
      statusColor: "gray",
      isLive: false,
      date: new Date().toISOString().split('T')[0],
      startTime: "11:30",
      endTime: "12:30"
    },
    {
      id: 3,
      time: "02:00 PM - 03:00 PM",
      title: "Investor Relations Prep",
      location: "Meeting Room 4B",
      isLive: false,
      date: new Date().toISOString().split('T')[0],
      startTime: "14:00",
      endTime: "15:00"
    }
  ]);

  const handleToggle = (itemId: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleScheduleNewMeeting = () => {
    setIsMeetingModalOpen(true);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  const handleExpandNotes = () => {
    toast.info("Expanding notes view...");
  };

  const handleToggleFormat = (format: 'bold' | 'italic' | 'list') => {
    setTextFormat(prev => ({
      ...prev,
      [format]: !prev[format]
    }));
    toast.success(`${format.charAt(0).toUpperCase() + format.slice(1)} ${textFormat[format] ? 'disabled' : 'enabled'}`);
  };

  // Generate calendar days dynamically
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Get first day of month and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get day of week for first day (0 = Sunday)
    const firstDayOfWeek = firstDay.getDay();
    
    // Get number of days in month
    const daysInMonth = lastDay.getDate();
    
    // Get previous month's last day
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    // Check which days have meetings
    const daysWithMeetings = new Set<number>();
    meetings.forEach(meeting => {
      const meetingDate = new Date(meeting.date);
      if (meetingDate.getMonth() === month && meetingDate.getFullYear() === year) {
        daysWithMeetings.add(meetingDate.getDate());
      }
    });
    
    const days = [];
    
    // Add previous month's days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDay - i,
        isOtherMonth: true,
        isToday: false,
        hasDot: false
      });
    }
    
    // Add current month's days
    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        isOtherMonth: false,
        isToday: isCurrentMonth && day === today.getDate(),
        hasDot: daysWithMeetings.has(day)
      });
    }
    
    // Add next month's days to fill the grid
    const remainingDays = 35 - days.length; // 5 weeks * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        day,
        isOtherMonth: true,
        isToday: false,
        hasDot: false
      });
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  const checklistItems = [
    { id: "item1", label: "Review Q3 Financial Reports", checked: true },
    { id: "item2", label: "Distribute Agenda to Team", checked: true },
    { id: "item3", label: "Prepare Slide Deck v2", checked: false },
    { id: "item4", label: "Setup Video Conference Link", checked: false },
  ];

  const completedCount = checklistItems.filter(item => checkedItems[item.id]).length;

  // Filter and sort today's meetings
  const getTodaysMeetings = () => {
    const today = new Date().toISOString().split('T')[0];
    return meetings
      .filter(meeting => meeting.date === today)
      .sort((a, b) => {
        const timeA = a.startTime.split(':').map(Number);
        const timeB = b.startTime.split(':').map(Number);
        return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
      });
  };

  // Check if a meeting is currently live
  const isMeetingLive = (meeting: typeof meetings[0]) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    if (meeting.date !== today) return false;
    
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [startHour, startMin] = meeting.startTime.split(':').map(Number);
    const [endHour, endMin] = meeting.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  };

  const todaysMeetings = getTodaysMeetings();

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
            Executive Hub
          </h1>
          <p 
            className="text-2xl italic"
            style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
          >
            Meetings &amp; Briefs
          </p>
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
            <div 
              className="w-4 h-4 rounded-full flex items-center justify-center"
              style={{
                color: "#059669",
                textShadow: "0 0 10px rgba(16, 185, 129, 0.2)"
              }}
            >
              ✓
            </div>
            <span className="text-xs font-bold tracking-wide" style={{ color: "#111827" }}>
              {todaysMeetings.length} {todaysMeetings.length === 1 ? 'MEETING' : 'MEETINGS'} TODAY
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
                className="text-5xl font-medium tracking-tight leading-tight"
                style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
              >
                Upcoming <span className="italic">Agenda.</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="mt-3 text-lg font-light tracking-wide max-w-lg"
                style={{ color: "#6B7280" }}
              >
                Coordinate your schedule and prepare for executive sessions.
              </motion.p>
            </div>
            <button 
              className="px-7 py-4 rounded-xl text-white flex items-center gap-2 font-medium group ring-1 relative overflow-hidden transition-all duration-300 transform hover:scale-[1.03] active:scale-95"
              style={{
                backgroundColor: "#111827",
                ringColor: "rgba(255, 255, 255, 0.2)",
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
              onClick={handleScheduleNewMeeting}
            >
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
              ></div>
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" strokeWidth={2.5} />
              New Meeting
            </button>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-12 gap-8">
            {/* Left Column */}
            <div className="col-span-12 lg:col-span-7 space-y-8">
              {/* Calendar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="rounded-3xl p-8 border"
                style={{
                  background: "linear-gradient(160deg, rgba(255, 255, 255, 0.55) 0%, rgba(255, 255, 255, 0.4) 100%)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  borderColor: "rgba(255, 255, 255, 0.4)",
                  boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)"
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 
                    className="text-xl font-medium italic"
                    style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
                  >
                    {currentMonth.toLocaleString('default', { month: 'long' })} {currentMonth.getFullYear()}
                  </h3>
                  <div className="flex gap-2">
                    <button 
                      className="p-2 rounded-full transition-colors"
                      style={{ color: "#6B7280" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                      onClick={handlePrevMonth}
                    >
                      <ChevronLeft className="w-5 h-5" strokeWidth={2} />
                    </button>
                    <button 
                      className="p-2 rounded-full transition-colors"
                      style={{ color: "#6B7280" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                      onClick={handleNextMonth}
                    >
                      <ChevronRight className="w-5 h-5" strokeWidth={2} />
                    </button>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div 
                      key={i}
                      className="text-center text-xs font-bold uppercase tracking-wider py-2"
                      style={{ color: "#6B7280" }}
                    >
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((item, i) => (
                    <div
                      key={i}
                      className={`text-center py-3 cursor-pointer relative ${
                        item.isToday 
                          ? 'text-white font-bold shadow-lg hover:scale-105 transition-transform rounded-xl' 
                          : item.isOtherMonth 
                            ? 'rounded-lg' 
                            : 'hover:bg-white/50 rounded-lg transition-colors'
                      }`}
                      style={
                        item.isToday 
                          ? { backgroundColor: "#111827", color: "#FFFFFF", zIndex: 10 }
                          : item.isOtherMonth 
                            ? { color: "#D1D5DB" } 
                            : { color: "#111827" }
                      }
                    >
                      {item.day}
                      {item.hasDot && (
                        <span 
                          className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full"
                          style={{ backgroundColor: "#111827" }}
                        ></span>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Schedule */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="rounded-3xl p-8 border"
                style={{
                  background: "linear-gradient(160deg, rgba(255, 255, 255, 0.65) 0%, rgba(255, 255, 255, 0.4) 100%)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  borderColor: "rgba(255, 255, 255, 0.6)",
                  boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)"
                }}
              >
                <h3 
                  className="text-xl font-medium italic mb-8"
                  style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
                >
                  Schedule
                </h3>

                <div className="space-y-6">
                  {todaysMeetings.length > 0 ? (
                    todaysMeetings.map((meeting, index) => {
                      const isLive = isMeetingLive(meeting);
                      const now = new Date();
                      const [startHour, startMin] = meeting.startTime.split(':').map(Number);
                      const startMinutes = startHour * 60 + startMin;
                      const currentMinutes = now.getHours() * 60 + now.getMinutes();
                      const isPast = currentMinutes > startMinutes && !isLive;
                      
                      return (
                        <div key={meeting.id} className="flex items-start gap-4 group cursor-pointer">
                          <div className="flex flex-col items-center mt-1">
                            <div 
                              className={`w-3 h-3 rounded-full border-2 border-white z-10 relative ${
                                isLive ? 'bg-green-500' : isPast ? 'bg-gray-400' : 'bg-white border-gray-300'
                              }`}
                              style={isLive ? {
                                boxShadow: "0 0 10px rgba(34, 197, 94, 0.4)"
                              } : {}}
                            >
                              {isLive && (
                                <div 
                                  className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"
                                ></div>
                              )}
                            </div>
                            {index < todaysMeetings.length - 1 && (
                              <div 
                                className="w-px mt-2 min-h-[60px]"
                                style={{ 
                                  height: "100%",
                                  backgroundColor: "#E5E7EB" 
                                }}
                              ></div>
                            )}
                          </div>
                          <div 
                            className={`flex-1 p-4 rounded-2xl border transition-all duration-300 ${
                              isLive 
                                ? 'border-white/80 shadow-lg'
                                : 'border-transparent hover:border-white/50'
                            }`}
                            style={{
                              backgroundColor: isLive ? "rgba(255, 255, 255, 0.6)" : "transparent",
                              backdropFilter: isLive ? "blur(4px)" : "none"
                            }}
                            onMouseEnter={(e) => {
                              if (!isLive) {
                                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.4)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isLive) {
                                e.currentTarget.style.backgroundColor = "transparent";
                              }
                            }}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span 
                                className="text-xs font-bold uppercase tracking-wider"
                                style={{ color: "#6B7280" }}
                              >
                                {meeting.time}
                              </span>
                              <span 
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  isLive
                                    ? 'bg-green-100/50 text-green-800 border border-green-200'
                                    : isPast
                                      ? 'bg-gray-100 text-gray-500'
                                      : 'bg-blue-100/50 text-blue-800 border border-blue-200'
                                }`}
                              >
                                {isLive ? 'Live' : isPast ? 'Completed' : 'Upcoming'}
                              </span>
                            </div>
                            <h4 
                              className={`text-lg ${isLive ? 'font-bold' : 'font-medium'}`}
                              style={{ color: "#111827" }}
                            >
                              {meeting.title}
                            </h4>
                            <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
                              {meeting.location}
                            </p>
                            {meeting.attendees && (
                              <div className="flex items-center gap-3 mt-4">
                                <div className="flex -space-x-2">
                                  <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200"></div>
                                  <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-300"></div>
                                  <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-400"></div>
                                </div>
                                <span className="text-xs font-medium" style={{ color: "#6B7280" }}>
                                  +{meeting.attendees - 3} attending
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-base italic" style={{ color: "#9CA3AF", fontFamily: "'Playfair Display', serif" }}>
                        No meetings scheduled for today
                      </p>
                      <button 
                        className="mt-4 px-5 py-2 rounded-xl border transition-all"
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.5)",
                          borderColor: "#E5E7EB",
                          color: "#111827"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.5)";
                        }}
                        onClick={handleScheduleNewMeeting}
                      >
                        Schedule Your First Meeting
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Right Column */}
            <div className="col-span-12 lg:col-span-5 space-y-8">
              {/* Meeting Notes */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="rounded-3xl p-8 flex flex-col border"
                style={{
                  background: "linear-gradient(160deg, rgba(255, 255, 255, 0.55) 0%, rgba(255, 255, 255, 0.4) 100%)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  borderColor: "rgba(255, 255, 255, 0.4)",
                  boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)",
                  height: "500px"
                }}
              >
                <div 
                  className="flex items-center justify-between mb-6 pb-4"
                  style={{ borderBottom: "1px solid rgba(243, 244, 246, 1)" }}
                >
                  <h3 
                    className="text-2xl"
                    style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
                  >
                    Meeting Notes
                  </h3>
                  <button 
                    className="p-2 rounded-full transition-colors"
                    style={{ color: "#6B7280" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#111827";
                      e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#6B7280";
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                    onClick={handleExpandNotes}
                  >
                    <Maximize2 className="w-5 h-5" strokeWidth={2} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                  <div className="group">
                    <label 
                      className="block text-xs font-bold uppercase tracking-wider mb-2"
                      style={{ color: "#6B7280" }}
                    >
                      Title
                    </label>
                    <input 
                      className="w-full bg-transparent border-0 text-lg font-bold p-0 pb-2 transition-colors outline-none"
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        color: "#111827",
                        borderBottom: "1px solid #E5E7EB"
                      }}
                      placeholder="Meeting Title"
                      type="text"
                      defaultValue="Q4 Strategy Sync"
                      onFocus={(e) => {
                        e.currentTarget.style.borderBottomColor = "#111827";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderBottomColor = "#E5E7EB";
                      }}
                    />
                  </div>

                  <div className="group mt-6">
                    <label 
                      className="block text-xs font-bold uppercase tracking-wider mb-2"
                      style={{ color: "#6B7280" }}
                    >
                      Key Talking Points
                    </label>
                    <textarea 
                      className="w-full bg-transparent border-0 resize-none text-sm leading-relaxed p-0 outline-none"
                      style={{ 
                        height: "264px",
                        color: "#6B7280"
                      }}
                      placeholder="Start typing your notes here..."
                      defaultValue={`1. Review Q3 performance metrics against targets.
2. Discuss resource allocation for upcoming projects.
3. Finalize timeline for the new product launch.
4. Address budget constraints in marketing department.

Action Items:
- [ ] Schedule follow-up with finance team
- [ ] Update slide deck for investors`}
                    />
                  </div>
                </div>

                <div 
                  className="pt-4 flex justify-between items-center mt-auto"
                  style={{ borderTop: "1px solid rgba(243, 244, 246, 1)" }}
                >
                  <span 
                    className="text-xs italic"
                    style={{ color: "#6B7280" }}
                  >
                    Last saved 2 mins ago
                  </span>
                  <div className="flex gap-2">
                    <button 
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: "#6B7280" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#111827";
                        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.5)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#6B7280";
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                      onClick={() => handleToggleFormat('bold')}
                    >
                      <Bold className="w-5 h-5" strokeWidth={2} />
                    </button>
                    <button 
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: "#6B7280" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#111827";
                        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.5)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#6B7280";
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                      onClick={() => handleToggleFormat('italic')}
                    >
                      <Italic className="w-5 h-5" strokeWidth={2} />
                    </button>
                    <button 
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: "#6B7280" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#111827";
                        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.5)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#6B7280";
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                      onClick={() => handleToggleFormat('list')}
                    >
                      <List className="w-5 h-5" strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Preparation Checklist */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="rounded-3xl p-8"
                style={{
                  background: "linear-gradient(160deg, rgba(255, 255, 255, 0.65) 0%, rgba(255, 255, 255, 0.4) 100%)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)"
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 
                    className="text-xl font-medium italic"
                    style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
                  >
                    Preparation Checklist
                  </h3>
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border"
                    style={{
                      backgroundColor: "#F0FDF4",
                      color: "#059669",
                      borderColor: "#BBF7D0"
                    }}
                  >
                    {completedCount}/{checklistItems.length}
                  </div>
                </div>

                <div className="space-y-4">
                  {checklistItems.map((item) => {
                    const isChecked = checkedItems[item.id];
                    return (
                      <label
                        key={item.id}
                        className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                          isChecked ? '' : 'shadow-sm'
                        }`}
                        style={{
                          backgroundColor: isChecked ? "transparent" : "rgba(255, 255, 255, 0.3)",
                          borderColor: isChecked ? "transparent" : "rgba(255, 255, 255, 0.5)"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isChecked ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 255, 255, 0.6)";
                          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.5)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isChecked ? "transparent" : "rgba(255, 255, 255, 0.3)";
                          e.currentTarget.style.borderColor = isChecked ? "transparent" : "rgba(255, 255, 255, 0.5)";
                        }}
                      >
                        <span 
                          className={`text-sm font-medium transition-colors ${
                            isChecked ? 'line-through' : 'font-bold'
                          }`}
                          style={{ 
                            color: isChecked ? "#9CA3AF" : "#111827" 
                          }}
                        >
                          {item.label}
                        </span>
                        <div className="relative">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={isChecked}
                            onChange={() => handleToggle(item.id)}
                          />
                          <div 
                            className="w-10 h-6 rounded-full transition-colors"
                            style={{
                              backgroundColor: isChecked ? "#111827" : "#E5E7EB",
                              boxShadow: isChecked ? "0 2px 4px rgba(0,0,0,0.1), inset 0 -1px 2px rgba(255,255,255,0.8)" : "inset 0 2px 4px rgba(0,0,0,0.1)"
                            }}
                          ></div>
                          <div 
                            className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm"
                            style={{
                              transform: isChecked ? "translateX(100%)" : "translateX(0)"
                            }}
                          ></div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
      {isMeetingModalOpen && (
        <MeetingCreationModal
          isOpen={isMeetingModalOpen}
          onClose={() => setIsMeetingModalOpen(false)}
          onCreateMeeting={(meetingData: MeetingData) => {
            // Format time for display
            const formatTime = (time: string) => {
              const [hours, minutes] = time.split(':');
              const hour = parseInt(hours);
              const ampm = hour >= 12 ? 'PM' : 'AM';
              const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
              return `${displayHour}:${minutes} ${ampm}`;
            };

            // Create the new meeting object
            const newMeeting = {
              id: Date.now(), // Unique ID
              time: `${formatTime(meetingData.startTime)} - ${formatTime(meetingData.endTime)}`,
              title: meetingData.title,
              location: meetingData.locationType === "online" 
                ? `Online • ${meetingData.location || 'Video Call'}` 
                : `${meetingData.location} • In-person`,
              isLive: false,
              date: meetingData.date,
              startTime: meetingData.startTime,
              endTime: meetingData.endTime
            };

            // Add to meetings state
            setMeetings(prev => [...prev, newMeeting]);

            toast.success(`"${meetingData.title}" scheduled successfully!`, {
              description: `${meetingData.date} at ${meetingData.startTime}`
            });
          }}
        />
      )}
    </div>
  );
}