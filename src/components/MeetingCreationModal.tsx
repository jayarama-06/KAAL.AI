import { useState } from "react";
import { X, Calendar, Clock, MapPin, Users, FileText, Video, Building } from "lucide-react";

interface MeetingCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateMeeting?: (meeting: MeetingData) => void;
}

export interface MeetingData {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  locationType: "in-person" | "online";
  attendees: string;
  agenda: string;
  meetingLink?: string;
}

export function MeetingCreationModal({ isOpen, onClose, onCreateMeeting }: MeetingCreationModalProps) {
  const [title, setTitle] = useState("");
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date();
  const defaultDate = today.toISOString().split('T')[0];
  const defaultStartTime = "09:00";
  const defaultEndTime = "10:00";
  
  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState(defaultStartTime);
  const [endTime, setEndTime] = useState(defaultEndTime);
  const [locationType, setLocationType] = useState<"in-person" | "online">("online");
  const [location, setLocation] = useState("");
  const [attendees, setAttendees] = useState("");
  const [agenda, setAgenda] = useState("");
  const [meetingLink, setMeetingLink] = useState("");

  if (!isOpen) return null;

  const handleCreate = () => {
    const meetingData: MeetingData = {
      title,
      date: selectedDate,
      startTime,
      endTime,
      location: locationType === "online" ? meetingLink : location,
      locationType,
      attendees,
      agenda,
      meetingLink: locationType === "online" ? meetingLink : undefined
    };
    
    if (onCreateMeeting) {
      onCreateMeeting(meetingData);
    }
    
    // Reset form
    setTitle("");
    setLocation("");
    setAttendees("");
    setAgenda("");
    setMeetingLink("");
    setLocationType("online");
    
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(55, 65, 81, 0.4)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl rounded-[32px] shadow-2xl border relative overflow-hidden transform transition-all max-h-[90vh] flex flex-col"
        style={{
          background: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(48px)",
          WebkitBackdropFilter: "blur(48px)",
          borderColor: "rgba(255, 255, 255, 0.5)",
          boxShadow: "0 20px 60px -15px rgba(0,0,0,0.1)",
          animation: "fadeInUp 0.3s ease-out forwards"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top gradient bar */}
        <div 
          className="absolute top-0 left-0 right-0 h-1"
          style={{
            background: "linear-gradient(to right, #E5E7EB, #9CA3AF, #E5E7EB)",
            opacity: 0.5
          }}
        ></div>

        <div className="p-8 md:p-10 relative z-10 flex flex-col h-full overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-start mb-8 flex-shrink-0">
            <div className="pr-8">
              <h2 
                className="text-3xl md:text-4xl font-medium tracking-tight leading-none mb-2"
                style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
              >
                Schedule New Meeting
              </h2>
              <p className="text-sm font-light tracking-wide" style={{ color: "#6B7280" }}>
                Create a meeting with your team and stakeholders.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-900 transition-colors p-2 rounded-full hover:bg-gray-100/50 -mt-2 -mr-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6 flex-1 overflow-y-auto pr-2" style={{ scrollbarWidth: "thin" }}>
            {/* Meeting Title */}
            <div className="group relative">
              <label 
                className="block text-[10px] font-bold uppercase tracking-[0.2em] mb-2 ml-1"
                style={{ color: "#6B7280" }}
              >
                Meeting Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border rounded-2xl px-5 py-4 text-lg placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 shadow-sm transition-all font-medium"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.5)",
                  borderColor: "#E5E7EB",
                  color: "#111827"
                }}
                placeholder="Q4 Strategy Review"
              />
            </div>

            {/* Date and Time */}
            <div className="space-y-4">
              <div>
                <label 
                  className="block text-[10px] font-bold uppercase tracking-[0.2em] mb-2 ml-1"
                  style={{ color: "#6B7280" }}
                >
                  Date
                </label>
                <div className="relative">
                  <Calendar 
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400" 
                  />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full border rounded-2xl pl-12 pr-5 py-4 text-base font-medium focus:outline-none focus:ring-1 focus:ring-gray-300 shadow-sm transition-all"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.5)",
                      borderColor: "#E5E7EB",
                      color: "#111827"
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label 
                    className="block text-[10px] font-bold uppercase tracking-[0.2em] mb-2 ml-1"
                    style={{ color: "#6B7280" }}
                  >
                    Start Time
                  </label>
                  <div className="relative">
                    <Clock 
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400" 
                    />
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full border rounded-2xl pl-12 pr-5 py-4 text-base font-medium focus:outline-none focus:ring-1 focus:ring-gray-300 shadow-sm transition-all"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.5)",
                        borderColor: "#E5E7EB",
                        color: "#111827"
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label 
                    className="block text-[10px] font-bold uppercase tracking-[0.2em] mb-2 ml-1"
                    style={{ color: "#6B7280" }}
                  >
                    End Time
                  </label>
                  <div className="relative">
                    <Clock 
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400" 
                    />
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full border rounded-2xl pl-12 pr-5 py-4 text-base font-medium focus:outline-none focus:ring-1 focus:ring-gray-300 shadow-sm transition-all"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.5)",
                        borderColor: "#E5E7EB",
                        color: "#111827"
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Location Type */}
            <div>
              <label 
                className="block text-[10px] font-bold uppercase tracking-[0.2em] mb-3 ml-1"
                style={{ color: "#6B7280" }}
              >
                Location Type
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setLocationType("online")}
                  className="relative p-4 rounded-2xl border transition-all"
                  style={{
                    backgroundColor: locationType === "online" ? "rgba(255, 255, 255, 0.7)" : "rgba(255, 255, 255, 0.3)",
                    borderColor: locationType === "online" ? "#111827" : "#E5E7EB",
                    borderWidth: locationType === "online" ? "2px" : "1px"
                  }}
                >
                  <Video className="w-5 h-5 mb-2" style={{ color: locationType === "online" ? "#111827" : "#6B7280" }} />
                  <div className="text-sm font-bold" style={{ color: locationType === "online" ? "#111827" : "#6B7280" }}>
                    Online
                  </div>
                  <div className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
                    Video conference
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setLocationType("in-person")}
                  className="relative p-4 rounded-2xl border transition-all"
                  style={{
                    backgroundColor: locationType === "in-person" ? "rgba(255, 255, 255, 0.7)" : "rgba(255, 255, 255, 0.3)",
                    borderColor: locationType === "in-person" ? "#111827" : "#E5E7EB",
                    borderWidth: locationType === "in-person" ? "2px" : "1px"
                  }}
                >
                  <Building className="w-5 h-5 mb-2" style={{ color: locationType === "in-person" ? "#111827" : "#6B7280" }} />
                  <div className="text-sm font-bold" style={{ color: locationType === "in-person" ? "#111827" : "#6B7280" }}>
                    In-Person
                  </div>
                  <div className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
                    Physical location
                  </div>
                </button>
              </div>
            </div>

            {/* Location/Meeting Link */}
            <div>
              <label 
                className="block text-[10px] font-bold uppercase tracking-[0.2em] mb-2 ml-1"
                style={{ color: "#6B7280" }}
              >
                {locationType === "online" ? "Meeting Link" : "Location"}
              </label>
              <div className="relative">
                {locationType === "online" ? (
                  <Video className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400" />
                ) : (
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400" />
                )}
                <input
                  type="text"
                  value={locationType === "online" ? meetingLink : location}
                  onChange={(e) => locationType === "online" ? setMeetingLink(e.target.value) : setLocation(e.target.value)}
                  className="w-full border rounded-2xl pl-12 pr-5 py-4 text-base placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 shadow-sm transition-all"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.5)",
                    borderColor: "#E5E7EB",
                    color: "#111827"
                  }}
                  placeholder={locationType === "online" ? "https://zoom.us/j/..." : "Conference Room 4B"}
                />
              </div>
            </div>

            {/* Attendees */}
            <div>
              <label 
                className="block text-[10px] font-bold uppercase tracking-[0.2em] mb-2 ml-1"
                style={{ color: "#6B7280" }}
              >
                Attendees (comma separated)
              </label>
              <div className="relative">
                <Users className="absolute left-4 top-4 w-4 h-4 pointer-events-none text-gray-400" />
                <input
                  type="text"
                  value={attendees}
                  onChange={(e) => setAttendees(e.target.value)}
                  className="w-full border rounded-2xl pl-12 pr-5 py-4 text-base placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 shadow-sm transition-all"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.5)",
                    borderColor: "#E5E7EB",
                    color: "#111827"
                  }}
                  placeholder="john@example.com, jane@example.com"
                />
              </div>
            </div>

            {/* Agenda */}
            <div>
              <label 
                className="block text-[10px] font-bold uppercase tracking-[0.2em] mb-2 ml-1"
                style={{ color: "#6B7280" }}
              >
                Agenda / Notes
              </label>
              <div className="relative">
                <FileText className="absolute left-4 top-4 w-4 h-4 pointer-events-none text-gray-400" />
                <textarea
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  rows={4}
                  className="w-full border rounded-2xl pl-12 pr-5 py-4 text-base placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 shadow-sm transition-all resize-none"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.5)",
                    borderColor: "#E5E7EB",
                    color: "#111827"
                  }}
                  placeholder="1. Review Q4 metrics&#10;2. Discuss resource allocation&#10;3. Plan next quarter"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-4 mt-8 pt-6 border-t flex-shrink-0" style={{ borderColor: "#E5E7EB" }}>
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-2xl font-medium transition-all"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.5)",
                color: "#6B7280",
                border: "1px solid #E5E7EB"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.5)";
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="flex-1 px-6 py-4 rounded-2xl text-white font-bold transition-all shadow-lg"
              style={{
                backgroundColor: "#111827",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#1F2937";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#111827";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
              }}
            >
              Create Meeting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
