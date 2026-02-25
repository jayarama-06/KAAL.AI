import { useState, useEffect } from "react";
import { 
  CheckCircle, 
  Brain, 
  Hourglass, 
  Flame, 
  Heart, 
  LogOut 
} from "lucide-react";
import { useNavigate } from "react-router";
import { supabase } from "../services/supabase-client";
import { useAuth } from "../contexts/AuthContext";

export function DailyCheckoutScreen() {
  const [isSigningOff, setIsSigningOff] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    deepWorkSessions: 0,
    focusHours: 0,
    currentStreak: 0
  });
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchDailyStats();
    }
  }, [user]);

  const fetchDailyStats = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Get today's start and end timestamps (in milliseconds)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.getTime();
      const todayEnd = todayStart + (24 * 60 * 60 * 1000);

      // Fetch today's completed focus sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('start_time', todayStart)
        .lt('start_time', todayEnd);

      if (sessionsError) {
        console.error('Error fetching focus sessions:', sessionsError);
      }

      // Calculate deep work sessions count
      const deepWorkCount = sessions?.length || 0;

      // Calculate total focus hours (actual_duration is in minutes)
      const totalMinutes = sessions?.reduce((sum, session) => {
        return sum + (session.actual_duration || session.planned_duration || 0);
      }, 0) || 0;
      const focusHours = Math.round(totalMinutes / 60);

      // Update or create today's streak data if there's activity
      if (deepWorkCount > 0 || focusHours > 0) {
        const todayDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        const { error: upsertError } = await supabase
          .from('streak_data')
          .upsert({
            user_id: user.id,
            date: todayDate,
            focus_minutes: totalMinutes,
            tasks_completed: 0, // This could be fetched from tasks table if needed
            energy_logs_count: 0, // This could be fetched from energy_logs if needed
            is_active_day: true
          }, {
            onConflict: 'user_id,date'
          });

        if (upsertError) {
          console.error('Error updating streak data:', upsertError);
        }
      }

      // Fetch current streak
      const { data: streakData, error: streakError } = await supabase
        .from('streak_data')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active_day', true)
        .order('date', { ascending: false });

      if (streakError) {
        console.error('Error fetching streak data:', streakError);
      }

      // Calculate consecutive streak
      let currentStreak = 0;
      if (streakData && streakData.length > 0) {
        const sortedDates = streakData.map(d => new Date(d.date));
        currentStreak = 1;
        
        for (let i = 0; i < sortedDates.length - 1; i++) {
          const current = sortedDates[i];
          const next = sortedDates[i + 1];
          const diffDays = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }

      setStats({
        deepWorkSessions: deepWorkCount,
        focusHours: focusHours,
        currentStreak: currentStreak
      });
    } catch (error) {
      console.error('Error fetching daily stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOff = () => {
    setIsSigningOff(true);
    // Simulate sign off animation
    setTimeout(() => {
      navigate("/dashboard");
    }, 1500);
  };

  return (
    <div 
      className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden"
      style={{
        backgroundColor: "#F3F4F6",
        backgroundImage: `
          radial-gradient(at 0% 0%, rgba(167, 139, 250, 0.3) 0px, transparent 50%),
          radial-gradient(at 100% 0%, rgba(251, 191, 36, 0.2) 0px, transparent 50%),
          radial-gradient(at 100% 100%, rgba(167, 139, 250, 0.3) 0px, transparent 50%),
          radial-gradient(at 0% 100%, rgba(251, 191, 36, 0.2) 0px, transparent 50%),
          radial-gradient(at 50% 50%, rgba(255, 255, 255, 0.8) 0px, transparent 50%)
        `,
        backgroundSize: "150% 150%",
        opacity: isSigningOff ? 0 : 1,
        filter: isSigningOff ? "blur(10px)" : "none",
        transition: "opacity 1.5s ease-in-out, filter 1.5s ease-in-out"
      }}
    >
      {/* Noise Texture */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none mix-blend-overlay opacity-40"
        style={{
          backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noiseFilter\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.65\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noiseFilter)\" opacity=\"0.04\"/%3E%3C/svg%3E')"
        }}
      />

      {/* Animated Background Blobs */}
      <div 
        className="absolute top-[-10%] left-[-10%] rounded-full blur-[100px]"
        style={{
          width: "40vw",
          height: "40vw",
          backgroundColor: "rgba(139, 92, 246, 0.2)",
          animation: "pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite"
        }}
      />
      <div 
        className="absolute bottom-[-10%] right-[-10%] rounded-full blur-[100px]"
        style={{
          width: "40vw",
          height: "40vw",
          backgroundColor: "rgba(251, 191, 36, 0.3)",
          animation: "pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite 2s"
        }}
      />

      {/* Main Content */}
      <main className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center justify-center">
        {/* Top Badge */}
        <div 
          className="absolute top-12 left-1/2 transform -translate-x-1/2 opacity-0"
          style={{ animation: "fadeIn 1s ease-out 0.2s forwards" }}
        >
          <div 
            className="flex items-center gap-3 px-6 py-2 rounded-full border shadow-sm"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.3)",
              backdropFilter: "blur(12px)",
              borderColor: "rgba(255, 255, 255, 0.4)"
            }}
          >
            <div 
              className="w-6 h-6 text-white rounded flex items-center justify-center font-serif font-bold text-sm"
              style={{ backgroundColor: "#111827" }}
            >
              K
            </div>
            <span 
              className="text-sm font-bold tracking-[0.2em] font-serif uppercase"
              style={{ color: "rgba(17, 24, 39, 0.8)" }}
            >
              Daily Close
            </span>
          </div>
        </div>

        {/* Glass Card */}
        <div 
          className="rounded-[2rem] p-12 w-full shadow-lg relative overflow-hidden opacity-0"
          style={{
            background: "rgba(255, 255, 255, 0.65)",
            backdropFilter: "blur(20px) saturate(160%)",
            WebkitBackdropFilter: "blur(20px) saturate(160%)",
            border: "1px solid rgba(255, 255, 255, 0.6)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)",
            animation: "slideUp 0.8s ease-out 0.3s forwards"
          }}
        >
          {/* Top Glow */}
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-1/2 opacity-50 blur-xl pointer-events-none"
            style={{
              background: "linear-gradient(to bottom, rgba(255, 255, 255, 0.6), transparent)"
            }}
          />

          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Icon */}
            <div className="mb-8 relative">
              <div 
                className="absolute inset-0 rounded-full blur-2xl opacity-20"
                style={{
                  backgroundColor: "#10B981",
                  animation: "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite"
                }}
              />
              <div 
                className="w-20 h-20 rounded-full border shadow-lg flex items-center justify-center relative z-10"
                style={{
                  background: "linear-gradient(to bottom right, #ECFDF5, #D1FAE5)",
                  borderColor: "#A7F3D0",
                  animation: "float 8s ease-in-out infinite"
                }}
              >
                <CheckCircle 
                  className="w-10 h-10 fill-green-600" 
                  style={{ color: "#059669" }}
                />
              </div>
            </div>

            {/* Title */}
            <h1 
              className="text-5xl md:text-6xl font-medium mb-4 tracking-tight"
              style={{ 
                fontFamily: "'Playfair Display', serif",
                color: "#111827"
              }}
            >
              Excellence{" "}
              <span className="italic" style={{ color: "#1F2937" }}>
                Achieved
              </span>
            </h1>

            <p 
              className="text-lg font-light tracking-wide mb-12 max-w-md mx-auto"
              style={{ color: "#6B7280" }}
            >
              You've completed your schedule for today. Take a moment to reflect on your progress.
            </p>

            {/* Stats Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="rounded-2xl p-6 flex flex-col items-center justify-center gap-3 animate-pulse"
                    style={{
                      background: "rgba(255, 255, 255, 0.4)",
                      border: "1px solid rgba(255, 255, 255, 0.5)",
                      minHeight: "180px"
                    }}
                  >
                    <div className="w-12 h-12 rounded-full bg-gray-200" />
                    <div className="w-16 h-10 bg-gray-200 rounded" />
                    <div className="w-32 h-4 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12">
                <StatCard
                  icon={<Brain className="w-6 h-6" />}
                  value={stats.deepWorkSessions.toString()}
                  label="Deep Work Sessions"
                  bgColor="rgba(237, 233, 254, 1)"
                  iconColor="#7C3AED"
                />
                <StatCard
                  icon={<Hourglass className="w-6 h-6" />}
                  value={stats.focusHours.toString()}
                  label="Focus Hours"
                  bgColor="rgba(254, 243, 199, 1)"
                  iconColor="#D97706"
                />
                <StatCard
                  icon={<Flame className="w-6 h-6" />}
                  value={stats.currentStreak.toString()}
                  suffix="days"
                  label="Daily Streak Maintained"
                  bgColor="rgba(219, 234, 254, 1)"
                  iconColor="#2563EB"
                />
              </div>
            )}

            {/* Divider */}
            <div 
              className="w-full h-px mb-10 opacity-50"
              style={{
                background: "linear-gradient(to right, transparent, #D1D5DB, transparent)"
              }}
            />

            {/* Bottom Section */}
            <div className="flex flex-col md:flex-row justify-between items-center w-full gap-8">
              {/* Recovery Tip */}
              <div 
                className="flex items-start gap-4 text-left max-w-md p-4 rounded-xl border shadow-sm"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.4)",
                  borderColor: "rgba(255, 255, 255, 0.5)"
                }}
              >
                <Heart 
                  className="w-5 h-5 mt-1 flex-shrink-0" 
                  style={{ color: "#8B5CF6" }}
                />
                <div>
                  <h4 
                    className="text-sm font-bold uppercase tracking-wide mb-1"
                    style={{ color: "#111827" }}
                  >
                    Cognitive Recovery Tip
                  </h4>
                  <p 
                    className="text-sm leading-relaxed"
                    style={{ color: "#6B7280" }}
                  >
                    Consider a 15-minute disconnect from screens to lower cortisol levels before your evening routine.
                  </p>
                </div>
              </div>

              {/* Sign Off Button */}
              <button
                onClick={handleSignOff}
                className="group relative overflow-hidden rounded-full text-white shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] active:scale-95 pl-8 pr-2 py-2 flex items-center gap-4 border w-full md:w-auto justify-between md:justify-start"
                style={{
                  backgroundColor: "#111827",
                  borderColor: "rgba(255, 255, 255, 0.1)"
                }}
              >
                {/* Shine Effect */}
                <div 
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                    backgroundSize: "200% 100%",
                    animation: "shine 3s infinite linear"
                  }}
                />
                
                <span className="font-medium tracking-wide text-sm whitespace-nowrap z-10">
                  Sign off for Today
                </span>
                
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors z-10"
                  style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                >
                  <LogOut 
                    className="w-5 h-5 group-hover:rotate-[-45deg] transition-transform duration-500" 
                  />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer 
          className="absolute bottom-8 text-center opacity-0"
          style={{ animation: "fadeIn 1s ease-out 1s forwards" }}
        >
          <p 
            className="text-xs font-medium tracking-widest uppercase"
            style={{ color: "rgba(107, 114, 128, 0.6)" }}
          >
            Kaal OS v2.4 • Pursuit of Mastery
          </p>
        </footer>
      </main>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes slideUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes shine {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  suffix?: string;
  label: string;
  bgColor: string;
  iconColor: string;
}

function StatCard({ icon, value, suffix, label, bgColor, iconColor }: StatCardProps) {
  return (
    <div 
      className="rounded-2xl p-6 flex flex-col items-center justify-center gap-3 group transition-all duration-300 hover:scale-[1.02]"
      style={{
        background: "rgba(255, 255, 255, 0.4)",
        border: "1px solid rgba(255, 255, 255, 0.5)",
        cursor: "default"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255, 255, 255, 0.7)";
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 10px 30px -5px rgba(0,0,0,0.05)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255, 255, 255, 0.4)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div 
        className="p-3 rounded-full mb-1 group-hover:scale-110 transition-transform duration-300"
        style={{ backgroundColor: bgColor, color: iconColor }}
      >
        {icon}
      </div>
      
      <div 
        className="text-4xl font-bold flex items-start"
        style={{ 
          fontFamily: "'Playfair Display', serif",
          color: "#111827"
        }}
      >
        {value}
        {suffix && (
          <span 
            className="text-sm font-sans font-normal mt-1 ml-1"
            style={{ color: "#6B7280" }}
          >
            {suffix}
          </span>
        )}
      </div>
      
      <div 
        className="text-xs font-bold uppercase tracking-widest text-center"
        style={{ color: "rgba(107, 114, 128, 0.7)" }}
      >
        {label}
      </div>
    </div>
  );
}