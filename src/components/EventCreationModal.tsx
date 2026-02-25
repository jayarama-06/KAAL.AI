import { useState } from "react";
import { X, Edit, Calendar, Clock, FileText, ArrowRight, CheckSquare } from "lucide-react";
import { useTasks } from "../hooks/useTasks";

interface EventCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateEvent?: (event: EventData) => void;
}

export interface EventData {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  focusIntensity: number;
  notes: string;
  category?: string;
  taskIds?: string[]; // Associated task IDs
}

export function EventCreationModal({ isOpen, onClose, onCreateEvent }: EventCreationModalProps) {
  const [title, setTitle] = useState("Deep Work Session");
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date();
  const defaultDate = today.toISOString().split('T')[0];
  const defaultStartTime = today.toTimeString().slice(0, 5); // HH:MM format
  const defaultEndTime = new Date(today.getTime() + 90 * 60000).toTimeString().slice(0, 5); // 90 minutes later
  
  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState(defaultStartTime);
  const [endTime, setEndTime] = useState(defaultEndTime);
  const [focusIntensity, setFocusIntensity] = useState(75);
  const [notes, setNotes] = useState("");
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [showTaskSelector, setShowTaskSelector] = useState(false);

  // Fetch tasks from Supabase
  const { tasks } = useTasks({ realtime: true });

  // Filter tasks that are not completed
  const availableTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'archived');

  if (!isOpen) return null;

  const getFocusLabel = (value: number) => {
    if (value < 33) return "Casual";
    if (value < 67) return "Deep";
    return "Intense";
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleCreate = () => {
    const eventData: EventData = {
      title,
      date: selectedDate,
      startTime,
      endTime,
      focusIntensity,
      notes,
      taskIds: selectedTaskIds
    };
    
    if (onCreateEvent) {
      onCreateEvent(eventData);
    }
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
        className="w-full max-w-lg rounded-[32px] shadow-2xl border relative overflow-hidden transform transition-all max-h-[90vh] flex flex-col"
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
                Schedule New Event
              </h2>
              <p className="text-sm font-light tracking-wide" style={{ color: "#6B7280" }}>
                Plan your next focus block with precision.
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
            {/* Event Title */}
            <div className="group relative">
              <label 
                className="block text-[10px] font-bold uppercase tracking-[0.2em] mb-2 ml-1"
                style={{ color: "#6B7280" }}
              >
                Event Title
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
                placeholder="Deep Work Session"
              />
              <div className="absolute right-4 top-[2.4rem] text-gray-400 pointer-events-none group-focus-within:text-gray-900 transition-colors">
                <Edit className="w-5 h-5" />
              </div>
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

            {/* Focus Intensity Slider */}
            <div>
              <div className="flex justify-between items-center mb-3 px-1">
                <label 
                  className="text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-1"
                  style={{ color: "#6B7280" }}
                >
                  Focus Intensity
                </label>
                <span 
                  className="text-xs font-semibold bg-white px-2 py-0.5 rounded-md border shadow-sm"
                  style={{ color: "#111827", borderColor: "#E5E7EB" }}
                >
                  {getFocusLabel(focusIntensity)}
                </span>
              </div>
              <div 
                className="border rounded-2xl p-5 backdrop-blur-sm"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.4)",
                  borderColor: "#E5E7EB",
                  boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)"
                }}
              >
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={focusIntensity}
                  onChange={(e) => setFocusIntensity(Number(e.target.value))}
                  className="w-full h-1 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-0"
                  style={{
                    background: "linear-gradient(to right, #BFDBFE, #C4B5FD, #FCA5A5)",
                  }}
                />
                <div className="flex justify-between mt-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6B7280" }}>
                  <span>Casual</span>
                  <span>Deep</span>
                  <span>Intense</span>
                </div>
              </div>
            </div>

            {/* Notes Input */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FileText className="w-5 h-5 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
              </div>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-transparent border-b py-3 pl-12 pr-4 text-sm placeholder-gray-400 focus:outline-none transition-colors"
                style={{
                  color: "#111827",
                  borderColor: "#E5E7EB"
                }}
                placeholder="Add notes or drag files here..."
                onFocus={(e) => e.currentTarget.style.borderColor = "#111827"}
                onBlur={(e) => e.currentTarget.style.borderColor = "#E5E7EB"}
              />
            </div>

            {/* Task Selector */}
            <div className="space-y-3">
              <label 
                className="block text-[10px] font-bold uppercase tracking-[0.2em] mb-2 ml-1"
                style={{ color: "#6B7280" }}
              >
                Link Tasks {selectedTaskIds.length > 0 && `(${selectedTaskIds.length} selected)`}
              </label>
              <div className="relative">
                <div className="absolute left-4 top-4 pointer-events-none z-10">
                  <CheckSquare className="w-5 h-5 text-gray-400" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowTaskSelector(!showTaskSelector)}
                  className="w-full border rounded-2xl pl-12 pr-5 py-4 text-base text-left font-medium focus:outline-none focus:ring-1 focus:ring-gray-300 shadow-sm transition-all"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.5)",
                    borderColor: "#E5E7EB",
                    color: selectedTaskIds.length > 0 ? "#111827" : "#9CA3AF"
                  }}
                >
                  {selectedTaskIds.length > 0 
                    ? `${selectedTaskIds.length} task${selectedTaskIds.length > 1 ? 's' : ''} linked` 
                    : "Select tasks to work on..."}
                </button>
                
                {showTaskSelector && availableTasks.length > 0 && (
                  <div 
                    className="absolute left-0 right-0 top-full mt-2 border rounded-2xl shadow-xl overflow-hidden z-20 max-h-60 overflow-y-auto"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      backdropFilter: "blur(20px)",
                      borderColor: "#E5E7EB"
                    }}
                  >
                    {availableTasks.map(task => (
                      <label
                        key={task.id}
                        className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b last:border-b-0"
                        style={{ borderColor: "#F3F4F6" }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedTaskIds.includes(task.id)}
                          onChange={() => toggleTaskSelection(task.id)}
                          className="mt-1 w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium" style={{ color: "#111827" }}>
                            {task.title}
                          </div>
                          {task.description && (
                            <div className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                              {task.description}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span 
                              className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                              style={{
                                backgroundColor: task.priority === 'high' ? '#FEE2E2' : task.priority === 'medium' ? '#FEF3C7' : '#E0E7FF',
                                color: task.priority === 'high' ? '#991B1B' : task.priority === 'medium' ? '#92400E' : '#3730A3'
                              }}
                            >
                              {task.priority}
                            </span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                
                {showTaskSelector && availableTasks.length === 0 && (
                  <div 
                    className="absolute left-0 right-0 top-full mt-2 border rounded-2xl shadow-xl p-5 text-center"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      backdropFilter: "blur(20px)",
                      borderColor: "#E5E7EB"
                    }}
                  >
                    <p className="text-sm" style={{ color: "#6B7280" }}>
                      No available tasks. Create tasks first in the Tasks screen.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-10 pt-0 flex flex-col items-center justify-center space-y-4">
            <button
              onClick={handleCreate}
              className="w-full py-4 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 group"
              style={{
                backgroundColor: "#111827",
                color: "white",
                boxShadow: "0 10px 15px -3px rgba(17, 24, 39, 0.2)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(17, 24, 39, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(17, 24, 39, 0.2)";
              }}
            >
              <span 
                className="font-medium text-lg tracking-wide"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Create Event
              </span>
              <ArrowRight className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={onClose}
              className="text-xs font-bold uppercase tracking-widest transition-colors"
              style={{ color: "#6B7280" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#111827"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#6B7280"}
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Noise texture overlay */}
        <div 
          className="absolute inset-0 z-0 pointer-events-none mix-blend-multiply"
          style={{
            backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.05%22/%3E%3C/svg%3E')",
            opacity: 0.03
          }}
        ></div>
      </div>

      <style>{`
        input[type=range] {
          -webkit-appearance: none;
          background: transparent;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          margin-top: -8px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          border: 2px solid #f3f4f6;
        }
        input[type=range]::-webkit-slider-runnable-track {
          width: 100%;
          height: 4px;
          cursor: pointer;
          background: linear-gradient(to right, #BFDBFE, #C4B5FD, #FCA5A5);
          border-radius: 2px;
        }
        input[type=range]::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          border: 2px solid #f3f4f6;
        }
        input[type=range]::-moz-range-track {
          width: 100%;
          height: 4px;
          cursor: pointer;
          background: linear-gradient(to right, #BFDBFE, #C4B5FD, #FCA5A5);
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}