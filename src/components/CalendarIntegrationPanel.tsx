import { useState, useEffect } from "react";
import { Calendar, CheckCircle, AlertCircle, RefreshCw, Zap, Clock, Users } from "lucide-react";
import { googleCalendar, type CalendarEvent } from "../services/google-calendar-service";
import { supabase } from "../services/supabase-client";
import { toast } from "sonner@2.0.3";

interface CalendarIntegrationPanelProps {
  userId: string;
}

export function CalendarIntegrationPanel({ userId }: CalendarIntegrationPanelProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isConfigured, setIsConfigured] = useState(true);

  useEffect(() => {
    checkConnection();
  }, [userId]);

  useEffect(() => {
    if (isConnected) {
      loadUpcomingEvents();
    }
  }, [isConnected]);

  const checkConnection = async () => {
    setIsLoading(true);
    const connected = await googleCalendar.hasCalendarConnected(userId);
    setIsConnected(connected);
    setIsLoading(false);
  };

  const handleConnect = async () => {
    setIsLoading(true);
    const result = await googleCalendar.connectGoogleCalendar(userId);
    
    if (result.success) {
      toast.success("Calendar connected successfully!");
      setIsConnected(true);
      await loadUpcomingEvents();
    } else {
      if (result.error?.includes('not configured')) {
        setIsConfigured(false);
      }
      toast.error(result.error || "Failed to connect calendar");
    }
    setIsLoading(false);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    const result = await googleCalendar.syncCalendar(userId);
    
    if (result.success) {
      toast.success(`Synced ${result.eventCount || 0} events`);
      setLastSyncTime(new Date());
      await loadUpcomingEvents();
    } else {
      toast.error("Failed to sync calendar");
    }
    setIsSyncing(false);
  };

  const loadUpcomingEvents = async () => {
    const events = await googleCalendar.getUpcomingEvents(userId);
    setUpcomingEvents(events.slice(0, 5)); // Show next 5 events
  };

  const getEventTypeColor = (type?: string) => {
    switch (type) {
      case 'meeting': return { bg: '#EFF6FF', text: '#2563EB', border: '#DBEAFE' };
      case 'focus_block': return { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' };
      case 'break': return { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' };
      case 'personal': return { bg: '#FCE7F3', text: '#DB2777', border: '#FBCFE8' };
      default: return { bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' };
    }
  };

  const getEventTypeIcon = (type?: string) => {
    switch (type) {
      case 'meeting': return <Users className="w-4 h-4" />;
      case 'focus_block': return <Zap className="w-4 h-4" />;
      case 'break': return '☕';
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const getCognitiveLoadLabel = (load?: number) => {
    if (!load) return 'Unknown';
    if (load === 1) return 'Very Light';
    if (load === 2) return 'Light';
    if (load === 3) return 'Moderate';
    if (load === 4) return 'Heavy';
    return 'Very Heavy';
  };

  const formatEventTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatEventDuration = (start: Date, end: Date) => {
    const minutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center animate-pulse">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-[#111827]">Calendar Integration</h3>
            <p className="text-xs text-[#6B7280]">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="bg-white rounded-2xl p-6 border-2 border-dashed border-blue-200 shadow-sm hover:border-blue-400 transition-all">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-[#111827] mb-1">
              Connect Your Calendar
            </h3>
            <p className="text-sm text-[#6B7280] mb-3">
              KAAL will analyze your schedule to find optimal deep work windows and suggest the best tasks based on your meetings
            </p>
            <ul className="text-xs text-[#6B7280] space-y-1 mb-4">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Find free slots for deep work
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Estimate cognitive load from meetings
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Recommend breaks before heavy meetings
              </li>
            </ul>
            <button
              onClick={handleConnect}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              <Calendar className="w-4 h-4" />
              Connect Google Calendar
            </button>
            <p className="text-xs text-[#9CA3AF] mt-2">
              Read-only access • We never modify your calendar
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-[#111827] flex items-center gap-2">
              Calendar Connected
              <CheckCircle className="w-4 h-4 text-green-500" />
            </h3>
            <p className="text-xs text-[#6B7280]">
              {lastSyncTime 
                ? `Last synced ${lastSyncTime.toLocaleTimeString()}`
                : 'Analyzing your schedule...'}
            </p>
          </div>
        </div>

        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-[#6B7280] mb-3">
            Next 24 Hours
          </h4>
          {upcomingEvents.map((event) => {
            const colors = getEventTypeColor(event.eventType);
            return (
              <div
                key={event.id}
                className="p-3 rounded-xl border transition-all hover:shadow-sm"
                style={{
                  backgroundColor: colors.bg,
                  borderColor: colors.border,
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
                    style={{ color: colors.text }}
                  >
                    {getEventTypeIcon(event.eventType)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h5 className="font-semibold text-sm mb-1" style={{ color: colors.text }}>
                      {event.title}
                    </h5>
                    
                    <div className="flex items-center gap-3 text-xs" style={{ color: colors.text }}>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatEventTime(event.startTime)}
                      </span>
                      <span>•</span>
                      <span>{formatEventDuration(event.startTime, event.endTime)}</span>
                      {event.attendeeCount > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {event.attendeeCount}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Cognitive Load */}
                    {event.cognitiveLoad && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className="w-1.5 h-3 rounded-full"
                              style={{
                                backgroundColor: level <= event.cognitiveLoad!
                                  ? colors.text
                                  : colors.border,
                              }}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-medium" style={{ color: colors.text }}>
                          {getCognitiveLoadLabel(event.cognitiveLoad)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-[#6B7280]">No upcoming events in the next 24 hours</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Great time for deep work!</p>
        </div>
      )}

      {/* AI Insights */}
      {upcomingEvents.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-start gap-2 p-3 rounded-xl bg-purple-50 border border-purple-200">
            <Zap className="w-4 h-4 text-purple-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-medium text-purple-900 mb-1">
                AI Schedule Analysis
              </p>
              <p className="text-xs text-purple-700">
                {upcomingEvents.filter(e => e.eventType === 'meeting').length > 2
                  ? "Heavy meeting day ahead. Recommend tackling quick tasks between meetings."
                  : upcomingEvents.some(e => e.cognitiveLoad && e.cognitiveLoad >= 4)
                  ? "High cognitive load meeting detected. Schedule easier tasks after."
                  : "Good schedule for deep work! Block time before meetings."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}