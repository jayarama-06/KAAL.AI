import { useState } from "react";
import { 
  ChevronLeft, 
  ChevronRight,
  MoreVertical,
  Plus,
  UtensilsCrossed
} from "lucide-react";
import { EventCreationModal, EventData } from "./EventCreationModal";
import { FocusSessionPanel, SessionData } from "./FocusSessionPanel";
import { useProfile } from "../context/ProfileContext";
import { toast } from "sonner@2.0.3";
import { useNavigate } from "react-router";
import { NotificationCenter } from "./NotificationCenter";

type ViewMode = "week" | "month" | "day";

interface CalendarEvent {
  id: string;
  title: string;
  category: string;
  startTime: string;
  endTime: string;
  day: number; // 0-6 for Mon-Sun
  top: number; // pixels from top
  height: number; // pixels
  color: string;
  borderColor: string;
  hasAttendees?: boolean;
  isLunch?: boolean;
  animationDelay?: string;
}

export function CalendarScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isSessionPanelOpen, setIsSessionPanelOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const { profile } = useProfile();
  const navigateRouter = useNavigate();

  // Calculate current week based on offset
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + (weekOffset * 7));
  const currentMonthDisplay = baseDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const startOfWeek = new Date(baseDate);
  const dayOfWeek = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - ((dayOfWeek + 6) % 7)); // Monday start
  const weekNumber = Math.ceil((startOfWeek.getDate() + new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), 1).getDay()) / 7);

  const handlePrevWeek = () => setWeekOffset(prev => prev - 1);
  const handleNextWeek = () => setWeekOffset(prev => prev + 1);
  const handleToday = () => setWeekOffset(0);

  const handleCreateEvent = (eventData: EventData) => {
    const newEvent: CalendarEvent = {
      id: `event-${Date.now()}`,
      title: eventData.title || 'New Event',
      category: eventData.category || 'General',
      startTime: eventData.startTime || '09:00',
      endTime: eventData.endTime || '10:00',
      day: new Date().getDay() === 0 ? 6 : new Date().getDay() - 1, // Convert to Mon=0
      top: 120,
      height: 120,
      color: "rgba(255, 255, 255, 0.7)",
      borderColor: "#34D399",
      animationDelay: "0s"
    };
    setCalendarEvents(prev => [...prev, newEvent]);
    toast.success(`"${newEvent.title}" added to calendar`);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsSessionPanelOpen(true);
  };

  const handleDeleteEvent = (eventId: string) => {
    const eventToDelete = calendarEvents.find(e => e.id === eventId);
    if (eventToDelete) {
      const confirmDelete = window.confirm(
        `Are you sure you want to delete "${eventToDelete.title}"?\n\nThis action cannot be undone.`
      );
      
      if (confirmDelete) {
        setCalendarEvents(prev => prev.filter(e => e.id !== eventId));
        toast.success(`"${eventToDelete.title}" deleted from calendar`);
        
        // Close panel if the deleted event was selected
        if (selectedEvent?.id === eventId) {
          setIsSessionPanelOpen(false);
          setSelectedEvent(null);
        }
      }
    }
  };

  const handleStartSession = () => {
    if (selectedEvent) {
      toast.success(`Focus session started for "${selectedEvent.title}"`);
    }
    setIsSessionPanelOpen(false);
    navigateRouter("/focus");
  };

  // Convert CalendarEvent to SessionData format
  const convertToSessionData = (event: CalendarEvent | null): SessionData | undefined => {
    if (!event) return undefined;
    
    return {
      title: event.title,
      startTime: event.startTime,
      endTime: event.endTime,
      duration: calculateDuration(event.startTime, event.endTime),
      type: event.category === "Deep Work" ? "focus" : event.isLunch ? "break" : "meeting",
      participant: {
        name: event.hasAttendees ? "Team Session" : "Solo Focus",
        initials: "JS",
        type: event.hasAttendees ? "group" : "solo"
      },
      intentions: `Goal: Complete ${event.title}. ${event.category ? `Focus area: ${event.category}` : ""}`
    };
  };

  const calculateDuration = (start: string, end: string): number => {
    // Simple duration calculation - you can make this more sophisticated
    const startHour = parseInt(start.split(":")[0]);
    const endHour = parseInt(end.split(":")[0]);
    const startMin = parseInt(start.split(":")[1]);
    const endMin = parseInt(end.split(":")[1]);
    return (endHour - startHour) * 60 + (endMin - startMin);
  };

  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    return {
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: d.getDate(),
      isToday: d.toDateString() === today.toDateString(),
      isWeekend: d.getDay() === 0 || d.getDay() === 6
    };
  });

  const hours = [
    { name: "08:00", label: "8 AM", offset: 0 },
    { name: "09:00", label: "9 AM", offset: 120 },
    { name: "10:00", label: "10 AM", offset: 240 },
    { name: "11:00", label: "11 AM", offset: 360 },
    { name: "12:00", label: "12 PM", offset: 480 },
    { name: "13:00", label: "1 PM", offset: 600 },
    { name: "14:00", label: "2 PM", offset: 720 },
    { name: "15:00", label: "3 PM", offset: 840 },
    { name: "16:00", label: "4 PM", offset: 960 },
    { name: "17:00", label: "5 PM", offset: 1080 }
  ];

  const events: CalendarEvent[] = [];

  const allEvents = [...events, ...calendarEvents];

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
            className="text-sm font-semibold tracking-wide uppercase opacity-60"
            style={{ color: "#6B7280" }}
          >
            Calendar View
          </h1>
          <div className="flex items-baseline gap-4">
            <div className="flex items-center gap-2">
              <button 
                onClick={handlePrevWeek}
                className="hover:bg-black/5 rounded-full p-1 transition-colors"
              >
                <ChevronLeft className="w-7 h-7" strokeWidth={1.5} style={{ color: "#111827" }} />
              </button>
              <span 
                className="text-3xl cursor-pointer hover:opacity-70 transition-opacity"
                style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
                onClick={handleToday}
              >
                {currentMonthDisplay}
              </span>
              <button 
                onClick={handleNextWeek}
                className="hover:bg-black/5 rounded-full p-1 transition-colors"
              >
                <ChevronRight className="w-7 h-7" strokeWidth={1.5} style={{ color: "#111827" }} />
              </button>
            </div>
            <span 
              className="text-sm font-medium uppercase tracking-widest"
              style={{ color: "rgba(107, 114, 128, 0.6)" }}
            >
              Week {weekNumber}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* View Mode Switcher */}
          <div 
            className="flex p-1 rounded-full border"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.4)",
              borderColor: "rgba(255, 255, 255, 0.6)",
              backdropFilter: "blur(4px)"
            }}
          >
            {(["week", "month", "day"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className="px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-colors"
                style={{
                  backgroundColor: viewMode === mode ? "white" : "transparent",
                  color: viewMode === mode ? "#111827" : "#6B7280",
                  boxShadow: viewMode === mode ? "0 1px 2px 0 rgba(0, 0, 0, 0.05)" : "none"
                }}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="h-10 w-px bg-gray-200"></div>

          <NotificationCenter />

          <div className="w-10 h-10 rounded-full ring-2 ring-white shadow-lg overflow-hidden">
            <img 
              src={profile.profileImage} 
              alt="User" 
              className="w-full h-full object-cover" 
            />
          </div>
        </div>
      </header>

      {/* Calendar Content */}
      <div className="flex-1 overflow-hidden flex flex-col relative">
        {/* Day Headers */}
        <div 
          className="grid grid-cols-8 border-b"
          style={{
            borderColor: "rgba(255, 255, 255, 0.4)",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(4px)"
          }}
        >
          <div 
            className="col-span-1 h-20 border-r flex items-center justify-center"
            style={{ borderColor: "rgba(255, 255, 255, 0.4)" }}
          >
            <span 
              className="text-xs font-bold uppercase tracking-widest opacity-50"
              style={{ color: "#6B7280" }}
            >
              GMT+2
            </span>
          </div>

          <div className="col-span-7 grid grid-cols-7 h-20">
            {days.map((day, index) => (
              <div
                key={index}
                className={`border-r flex flex-col items-center justify-center p-2 group hover:bg-white/20 transition-colors cursor-pointer relative ${
                  day.isWeekend ? "bg-gray-50/30" : ""
                }`}
                style={{ borderColor: "rgba(255, 255, 255, 0.4)" }}
              >
                {day.isToday && (
                  <div 
                    className="absolute inset-x-2 bottom-2 top-2 rounded-xl bg-white/0 group-hover:bg-white/40 transition-all duration-300"
                  ></div>
                )}
                <span 
                  className={`text-xs uppercase mb-1 z-10 ${
                    day.isToday ? "font-bold" : "font-medium"
                  }`}
                  style={{ color: day.isToday ? "#111827" : "#6B7280" }}
                >
                  {day.label}
                </span>
                {day.isToday ? (
                  <div 
                    className="w-10 h-10 flex items-center justify-center rounded-full text-white z-10"
                    style={{
                      backgroundColor: "#111827",
                      boxShadow: "0 0 20px rgba(17, 24, 39, 0.15)"
                    }}
                  >
                    <span 
                      className="text-2xl"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      {day.date}
                    </span>
                  </div>
                ) : (
                  <span 
                    className="text-2xl z-10"
                    style={{ 
                      fontFamily: "'Playfair Display', serif",
                      color: day.isWeekend ? "rgba(107, 114, 128, 0.6)" : "#6B7280"
                    }}
                  >
                    {day.date}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-y-auto scroll-smooth relative" style={{ scrollbarWidth: "none" }}>
          <div className="grid grid-cols-8 min-h-[1200px] relative">
            {/* Energy Wave Background on Tuesday (day 1) */}
            <div 
              className="absolute top-0 bottom-0 left-[calc(100%/8*2)] w-[calc(100%/8)] pointer-events-none z-0"
            >
              <svg className="w-full h-full opacity-30" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(99, 102, 241, 0)" />
                    <stop offset="20%" stopColor="rgba(99, 102, 241, 0.2)" />
                    <stop offset="50%" stopColor="rgba(236, 72, 153, 0.1)" />
                    <stop offset="80%" stopColor="rgba(99, 102, 241, 0.2)" />
                    <stop offset="100%" stopColor="rgba(99, 102, 241, 0)" />
                  </linearGradient>
                </defs>
                <path 
                  d="M40,0 C60,200 10,400 50,600 C90,800 20,1000 60,1200 L100,1200 L100,0 Z" 
                  fill="url(#waveGradient)" 
                  style={{ filter: "blur(20px)" }}
                />
                <path 
                  d="M40,0 C60,200 10,400 50,600 C90,800 20,1000 60,1200" 
                  fill="none" 
                  stroke="rgba(99, 102, 241, 0.2)" 
                  strokeWidth="2"
                  style={{
                    strokeDasharray: "1000",
                    strokeDashoffset: "1000",
                    animation: "dash 3s ease-out forwards"
                  }}
                />
              </svg>
            </div>

            {/* Current Time Indicator (11:15) */}
            <div 
              className="absolute left-0 right-0 top-[380px] z-20 pointer-events-none flex items-center"
            >
              <div className="w-[12.5%] text-right pr-4">
                <span className="text-xs font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                  11:15
                </span>
              </div>
              <div className="flex-1 h-px bg-red-400 relative">
                <div 
                  className="absolute left-0 -translate-y-1/2 w-2 h-2 rounded-full bg-red-500"
                  style={{ boxShadow: "0 0 8px rgba(239,68,68,0.6)" }}
                ></div>
              </div>
            </div>

            {/* Time Column */}
            <div 
              className="col-span-1 border-r z-10"
              style={{
                borderColor: "rgba(255, 255, 255, 0.3)",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(2px)"
              }}
            >
              {hours.map((hour, index) => (
                <div 
                  key={index}
                  className="h-[120px] border-b border-transparent relative"
                >
                  <span 
                    className="absolute -top-3 right-4 text-xs font-medium opacity-50"
                    style={{ 
                      color: "#6B7280",
                      fontFamily: "'Playfair Display', serif"
                    }}
                  >
                    {hour.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Day Columns */}
            <div className="col-span-7 grid grid-cols-7 relative z-10">
              {/* Day Grid Background */}
              <div 
                className="absolute inset-0 pointer-events-none z-0 opacity-50"
                style={{
                  backgroundImage: "linear-gradient(to bottom, rgba(0,0,0,0.02) 1px, transparent 1px)",
                  backgroundSize: "100% 120px"
                }}
              ></div>

              {/* Day Columns with Events */}
              {days.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className={`border-r h-full relative group ${
                    dayIndex === 1 ? "bg-white/5" : ""
                  } ${day.isWeekend ? "bg-gray-50/20" : ""}`}
                  style={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
                >
                  {/* Render events for this day */}
                  {allEvents
                    .filter((event) => event.day === dayIndex)
                    .map((event) => (
                      <div
                        key={event.id}
                        className={`absolute left-2 right-2 rounded-2xl p-4 cursor-pointer hover:scale-[1.02] transition-transform duration-300 z-10 ${
                          event.isLunch ? "opacity-60 hover:opacity-100" : ""
                        }`}
                        style={{
                          top: `${event.top}px`,
                          height: `${event.height}px`,
                          background: "linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.3) 100%)",
                          backdropFilter: "blur(12px)",
                          WebkitBackdropFilter: "blur(12px)",
                          border: `1px solid rgba(255, 255, 255, 0.6)`,
                          borderLeft: event.borderColor ? `4px solid ${event.borderColor}` : "none",
                          boxShadow: "inset 0 0 20px rgba(255,255,255,0.5), 0 8px 20px -5px rgba(0,0,0,0.05)",
                          animation: event.animationDelay ? `fadeInUp 0.8s ease-out ${event.animationDelay} forwards, floatPill 6s ease-in-out ${event.animationDelay} infinite` : "floatPill 6s ease-in-out infinite"
                        }}
                        onClick={() => handleEventClick(event)}
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

                        <div className="relative z-10">
                          {event.isLunch ? (
                            <div className="flex items-center gap-3 h-full">
                              <UtensilsCrossed 
                                className="w-5 h-5"
                                style={{ color: "rgba(17, 24, 39, 0.6)" }}
                              />
                              <span className="font-medium text-sm" style={{ color: "#111827" }}>
                                {event.title}
                              </span>
                            </div>
                          ) : event.hasAttendees ? (
                            <>
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                                    style={{ backgroundColor: event.borderColor }}
                                  ></div>
                                  <span 
                                    className="text-[10px] font-bold tracking-widest uppercase"
                                    style={{ color: event.borderColor.replace("0.8)", "1)") }}
                                  >
                                    {event.category}
                                  </span>
                                </div>
                                <MoreVertical 
                                  className="w-4 h-4"
                                  style={{ color: "rgba(17, 24, 39, 0.4)" }}
                                />
                              </div>
                              <h3 
                                className="font-semibold text-lg leading-tight mb-2"
                                style={{ 
                                  fontFamily: "'Playfair Display', serif",
                                  color: "#111827"
                                }}
                              >
                                {event.title}
                              </h3>
                              <div className="flex -space-x-2 mb-3">
                                <div className="w-6 h-6 rounded-full border border-white bg-gray-200"></div>
                                <div className="w-6 h-6 rounded-full border border-white bg-gray-300"></div>
                                <div className="w-6 h-6 rounded-full border border-white bg-gray-400 flex items-center justify-center text-[8px] text-white font-bold">
                                  +2
                                </div>
                              </div>
                              <span 
                                className="text-xs font-medium"
                                style={{ color: "rgba(107, 114, 128, 0.8)" }}
                              >
                                {event.startTime} - {event.endTime}
                              </span>
                            </>
                          ) : event.category === "Deep Work" && event.height === 100 ? (
                            <div 
                              className="h-full border-l-2 pl-3 flex flex-col justify-center"
                              style={{ borderColor: event.borderColor }}
                            >
                              <span 
                                className="text-xs font-bold mb-1"
                                style={{ color: event.borderColor.replace("0.8)", "1)") }}
                              >
                                {event.category}
                              </span>
                              <span 
                                className="text-[10px] font-medium"
                                style={{ color: event.borderColor.replace("#", "rgba(") + ", 0.7)" }}
                              >
                                {event.startTime} - {event.endTime}
                              </span>
                            </div>
                          ) : (
                            <div 
                              className="h-full border-l-2 pl-3 flex flex-col justify-center"
                              style={{ borderColor: event.borderColor }}
                            >
                              <span 
                                className="text-xs font-bold mb-1"
                                style={{ color: event.borderColor.replace("0.8)", "1)") }}
                              >
                                {event.category}
                              </span>
                              <span 
                                className="text-sm mb-1"
                                style={{ 
                                  fontFamily: "'Playfair Display', serif",
                                  color: "#111827"
                                }}
                              >
                                {event.title}
                              </span>
                              <span 
                                className="text-[10px] font-medium"
                                style={{ color: event.borderColor.replace("#", "rgba(") + ", 0.7)" }}
                              >
                                {event.startTime} - {event.endTime}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* New Event FAB */}
      <div className="fixed bottom-10 right-10 z-[60]">
        <button 
          className="rounded-full px-8 py-4 shadow-lg flex items-center gap-3 transition-all duration-500 hover:scale-105 active:scale-95 group border-none ring-1"
          style={{
            backgroundColor: "rgba(17, 24, 39, 0.9)",
            color: "white",
            ringColor: "rgba(255, 255, 255, 0.2)",
            backdropFilter: "blur(12px)",
            animation: "breathe 3s ease-in-out infinite",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "black";
            e.currentTarget.style.boxShadow = "0 0 30px rgba(17, 24, 39, 0.3), 0 0 60px rgba(17, 24, 39, 0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(17, 24, 39, 0.9)";
            e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
          }}
          onClick={() => setIsEventModalOpen(true)}
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          <span className="font-bold tracking-wide text-xs uppercase">New Event</span>
        </button>
      </div>

      {/* Event Creation Modal */}
      <EventCreationModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onCreateEvent={handleCreateEvent}
      />

      {/* Focus Session Panel */}
      <FocusSessionPanel
        isOpen={isSessionPanelOpen}
        onClose={() => setIsSessionPanelOpen(false)}
        onStartSession={handleStartSession}
        onDeleteEvent={
          selectedEvent && selectedEvent.id.startsWith('event-') 
            ? () => handleDeleteEvent(selectedEvent.id) 
            : undefined
        }
        sessionData={convertToSessionData(selectedEvent)}
        eventId={selectedEvent?.id}
      />

      {/* Animations */}
      <style>{`
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(17, 24, 39, 0.2); }
          50% { transform: scale(1.03); box-shadow: 0 0 35px rgba(17, 24, 39, 0.4); }
        }
        @keyframes floatPill {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes dash {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}