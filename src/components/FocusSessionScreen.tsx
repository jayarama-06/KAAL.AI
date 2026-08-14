import { useState, useEffect, useRef } from "react";
import { Music, Maximize, X, Pause, Play, FileEdit, Check } from "lucide-react";
import { NudgeSystem } from "./NudgeSystem";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { storageService } from "../services/storage-service";

export function FocusSessionScreen() {
  const [isHovered, setIsHovered]         = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const navigate = useNavigate();

  // ── Pick up intent set by Brain Dump ─────────────────────────────────────
  const [focusIntent, setFocusIntent] = useState<{
    taskTitle: string;
    durationMinutes: number;
  } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("kaal_focus_intent");
      if (raw) {
        const intent = JSON.parse(raw);
        if (Date.now() - intent.startedAt < 5 * 60_000) setFocusIntent(intent);
        localStorage.removeItem("kaal_focus_intent");
      }
    } catch {}
  }, []);

  const sessionDuration = focusIntent?.durationMinutes ?? 45;
  const taskTitle       = focusIntent?.taskTitle ?? "Deep Work Session";

  // ── Timer state ────────────────────────────────────────────────────────────
  const [secondsLeft, setSecondsLeft] = useState(sessionDuration * 60);
  const [running,     setRunning]     = useState(false); // start paused — user taps to begin
  const [done,        setDone]        = useState(false);
  const sessionStartRef               = useRef<number>(Date.now());
  const sessionIdRef                  = useRef<string>(`session-${Date.now()}`);

  useEffect(() => {
    setSecondsLeft(sessionDuration * 60);
    setRunning(false);
    setDone(false);
    sessionStartRef.current = Date.now();
    sessionIdRef.current    = `session-${Date.now()}`;
  }, [sessionDuration]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(t);
          setRunning(false);
          setDone(true);
          handleSessionComplete(sessionDuration * 60);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running]);

  // ── Save session to Supabase ─────────────────────────────────────────────
  const handleSessionComplete = async (plannedSeconds: number) => {
    const actualSeconds = plannedSeconds - secondsLeft;
    try {
      await storageService.saveSession({
        sessionId:            sessionIdRef.current,
        title:                taskTitle,
        startTime:            sessionStartRef.current,
        endTime:              Date.now(),
        plannedDuration:      plannedSeconds * 1000,
        actualDuration:       actualSeconds * 1000,
        status:               "completed",
        focusScore:           Math.round((actualSeconds / plannedSeconds) * 100),
        contextSwitches:      0,
        completionPercentage: Math.round((actualSeconds / plannedSeconds) * 100),
      });
      toast.success("Session saved!", { description: `${Math.round(actualSeconds / 60)} min logged to Analytics` });
    } catch {
      toast.success("Session complete!", { description: taskTitle });
    }
  };

  const handleEndSession = async () => {
    if (!window.confirm("End this focus session?")) return;
    setRunning(false);
    const actualSeconds = sessionDuration * 60 - secondsLeft;
    if (actualSeconds > 30) {
      try {
        await storageService.saveSession({
          sessionId:            sessionIdRef.current,
          title:                taskTitle,
          startTime:            sessionStartRef.current,
          endTime:              Date.now(),
          plannedDuration:      sessionDuration * 60 * 1000,
          actualDuration:       actualSeconds * 1000,
          status:               "completed",
          focusScore:           Math.round((actualSeconds / (sessionDuration * 60)) * 100),
          contextSwitches:      0,
          completionPercentage: Math.round((actualSeconds / (sessionDuration * 60)) * 100),
        });
        toast.success("Session saved", { description: `${Math.round(actualSeconds / 60)} min logged` });
      } catch {
        toast.success("Focus session ended");
      }
    }
    navigate("/dashboard");
  };

  const mins       = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs       = String(secondsLeft % 60).padStart(2, "0");
  const progress   = 1 - secondsLeft / (sessionDuration * 60);
  const circumference = 2 * Math.PI * 46;

  const handleMusicToggle = () => {
    setIsMusicPlaying(!isMusicPlaying);
    toast.info(isMusicPlaying ? "Ambient music paused" : "Ambient music playing", {
      description: isMusicPlaying ? "Music has been paused." : "Lo-fi beats for focus.",
    });
  };

  const handleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  return (
    <div
      className="h-screen w-screen overflow-hidden flex flex-col items-center justify-center relative font-sans antialiased"
      style={{ backgroundColor: "#0F1115", color: "#E5E7EB" }}
    >
      <NudgeSystem isActive={running} sessionDuration={sessionDuration} />

      {/* Background */}
      <div className="absolute inset-0 z-0" style={{ backgroundColor: "#0F1115" }} />

      {/* Breathing aura */}
      <div
        className="absolute pointer-events-none z-0"
        style={{
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "120vh", height: "120vh",
          background: "radial-gradient(circle, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0) 70%)",
          borderRadius: "50%",
          animation: running ? "breathe 10s ease-in-out infinite alternate" : "none",
        }}
      />

      {/* Top Right Controls */}
      <div className="absolute top-8 right-8 z-50 flex gap-4 opacity-0"
        style={{ animation: "fadeIn 1.5s ease-out 1s forwards" }}>
        <button
          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
          style={{ color: isMusicPlaying ? "white" : "#9CA3AF" }}
          onClick={handleMusicToggle}
        >
          <Music className="w-5 h-5" />
        </button>
        <button
          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
          style={{ color: "#9CA3AF" }}
          onClick={handleFullscreen}
        >
          <Maximize className="w-5 h-5" />
        </button>
        <button
          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
          style={{ color: "#9CA3AF" }}
          onClick={handleEndSession}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main timer */}
      <main
        className="relative z-30 flex flex-col items-center justify-center w-full h-full opacity-0"
        style={{ animation: "fadeIn 1.5s ease-out forwards" }}
      >
        {/* Timer ring — click to play/pause */}
        <div
          className="relative flex items-center justify-center mb-16 group cursor-pointer"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => { if (!done) setRunning(r => !r); }}
        >
          {/* Outer ring */}
          <svg className="w-[500px] h-[500px] absolute transform -rotate-90 opacity-60 pointer-events-none" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
          </svg>

          {/* Progress ring */}
          <svg className="w-[480px] h-[480px] absolute transform -rotate-90 overflow-visible" viewBox="0 0 100 100"
            style={{ filter: "drop-shadow(0 0 15px rgba(255,255,255,0.1))" }}>
            <defs>
              <linearGradient id="liquidGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="rgba(255,255,255,0)" />
                <stop offset="50%"  stopColor="rgba(255,255,255,0.1)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.5)" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.3" />
            <circle
              cx="50" cy="50" r="46" fill="none"
              stroke={done ? "rgba(99,255,132,0.4)" : "rgba(255,255,255,0.25)"}
              strokeWidth="0.8" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>

          {/* Timer display */}
          <div className="relative z-10 text-center flex flex-col items-center select-none transition-transform duration-700 ease-out"
            style={{ transform: isHovered ? "scale(1.05)" : "scale(1)" }}>
            <h1 className="text-[140px] leading-none font-thin tracking-tighter"
              style={{
                fontFamily: "'Playfair Display', serif",
                background: done
                  ? "linear-gradient(135deg, #6EE7B7, #34D399, #10B981)"
                  : "linear-gradient(135deg, white, #E5E7EB, #9CA3AF)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                filter: "drop-shadow(0 25px 25px rgba(0,0,0,0.5))",
              }}>
              {mins}:{secs}
            </h1>
            <p className="text-xs uppercase tracking-[0.3em] mt-4 font-medium opacity-60" style={{ color: "#9CA3AF" }}>
              {done ? "Complete!" : running ? "Focus Interval" : "Tap to Start"}
            </p>
          </div>

          {/* Play / Pause overlay */}
          {!done && (
            <div className="absolute inset-0 rounded-full flex items-center justify-center transition-opacity duration-500 z-20"
              style={{ opacity: isHovered ? 1 : 0 }}>
              <div className="w-24 h-24 rounded-full flex items-center justify-center border transition-transform duration-500"
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)",
                  borderColor: "rgba(255,255,255,0.1)", boxShadow: "0 0 40px rgba(255,255,255,0.03)",
                  transform: isHovered ? "scale(1)" : "scale(0.9)",
                }}>
                {running
                  ? <Pause className="w-10 h-10 text-white" />
                  : <Play  className="w-10 h-10 text-white ml-1" />
                }
              </div>
            </div>
          )}
        </div>

        {/* Action buttons — always visible */}
        <div className="flex items-center gap-4 opacity-0" style={{ animation: "fadeIn 1.5s ease-out 0.8s forwards" }}>
          {!done && (
            <button
              onClick={() => setRunning(r => !r)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl border text-sm font-semibold transition-all hover:scale-105 active:scale-95"
              style={{
                background: running ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.15)",
                borderColor: "rgba(255,255,255,0.15)",
                color: "white",
                backdropFilter: "blur(12px)",
              }}
            >
              {running ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4 ml-0.5" /> {secondsLeft === sessionDuration * 60 ? "Start" : "Resume"}</>}
            </button>
          )}
          {done && (
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold transition-all hover:scale-105 active:scale-95"
              style={{ background: "#10B981", color: "white" }}
            >
              <Check className="w-4 h-4" /> Done — go to Dashboard
            </button>
          )}
          <button
            onClick={handleEndSession}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl border text-sm transition-all hover:scale-105 active:scale-95"
            style={{ borderColor: "rgba(255,255,255,0.1)", color: "#6B7280", backdropFilter: "blur(12px)" }}
          >
            <X className="w-4 h-4" /> End early
          </button>
        </div>

        {/* Current Focus Card */}
        <div className="absolute bottom-20 z-40 opacity-0"
          style={{ animation: "fadeIn 1.5s ease-out 0.5s forwards, float 6s ease-in-out infinite" }}>
          <div className="rounded-2xl p-1 pr-6 flex items-center gap-5 max-w-lg mx-auto"
            style={{
              background: "rgba(255,255,255,0.02)", backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 4px 30px rgba(0,0,0,0.1)",
            }}>
            <div className="w-14 h-14 rounded-xl flex items-center justify-center border"
              style={{ background: "linear-gradient(135deg,rgba(255,255,255,0.1),transparent)", borderColor: "rgba(255,255,255,0.05)" }}>
              <FileEdit className="w-6 h-6" style={{ color: "rgba(255,255,255,0.8)" }} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: "#9CA3AF" }}>
                Current Focus
              </span>
              <h2 className="text-lg tracking-wide" style={{ color: "white", fontFamily: "'Playfair Display', serif" }}>
                {taskTitle}
              </h2>
            </div>
          </div>
        </div>
      </main>

      {/* KAAL Logo */}
      <div className="absolute bottom-8 left-8 z-10 opacity-30 pointer-events-none">
        <span className="font-bold text-lg tracking-tight" style={{ fontFamily: "'Playfair Display', serif", color: "white" }}>K</span>
      </div>

      <style>{`
        @keyframes fadeIn   { 0% { opacity: 0; } 100% { opacity: 1; } }
        @keyframes breathe  { 0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.4; } 50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.6; } }
        @keyframes float    { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes spin     { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
