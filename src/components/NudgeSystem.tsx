import { useState, useEffect } from "react";
import { NudgeNotification, NudgeType } from "./NudgeNotification";
import { BreakSuggestionModal } from "./BreakSuggestionModal";
import { AnimatePresence } from "motion/react";

export interface Nudge {
  id: string;
  type: NudgeType;
  title: string;
  message: string;
  position?: "bottom-left" | "top-right" | "top-left" | "bottom-right";
  delay?: number;
  duration?: number; // auto-dismiss after X milliseconds (0 = no auto-dismiss)
}

interface NudgeSystemProps {
  isActive?: boolean;
  sessionDuration?: number; // in minutes, for triggering break suggestions
}

export function NudgeSystem({ 
  isActive = true,
  sessionDuration = 0 
}: NudgeSystemProps) {
  const [activeNudges, setActiveNudges] = useState<Nudge[]>([]);
  const [showBreakModal, setShowBreakModal] = useState(false);

  // Only show break suggestion after 90+ minutes (real behavior)
  useEffect(() => {
    if (!isActive) return;

    // Show break suggestion modal after 90 minutes of focus
    if (sessionDuration >= 90) {
      const breakTimer = setTimeout(() => {
        setShowBreakModal(true);
      }, 3000);
      return () => clearTimeout(breakTimer);
    }
  }, [isActive, sessionDuration]);

  const addNudge = (nudge: Nudge) => {
    setActiveNudges(prev => [...prev, nudge]);

    // Auto-dismiss if duration is set
    if (nudge.duration && nudge.duration > 0) {
      setTimeout(() => {
        removeNudge(nudge.id);
      }, nudge.duration);
    }
  };

  const removeNudge = (id: string) => {
    setActiveNudges(prev => prev.filter(n => n.id !== id));
  };

  const handleStartBreak = () => {
    console.log("Starting 5-minute break...");
    setShowBreakModal(false);
  };

  // Public method to trigger custom nudges (can be called from parent components)
  const triggerNudge = (nudge: Omit<Nudge, 'id'>) => {
    addNudge({
      ...nudge,
      id: `custom-${Date.now()}`
    });
  };

  // Expose triggerNudge method to parent components if needed
  useEffect(() => {
    // @ts-ignore - Attach to window for easy access from any component
    window.triggerKaalNudge = triggerNudge;
    
    return () => {
      // @ts-ignore
      delete window.triggerKaalNudge;
    };
  }, []);

  if (!isActive) return null;

  return (
    <>
      {/* Nudge Notifications - only triggered programmatically */}
      <AnimatePresence>
        {activeNudges.map((nudge) => (
          <NudgeNotification
            key={nudge.id}
            type={nudge.type}
            title={nudge.title}
            message={nudge.message}
            position={nudge.position}
            delay={nudge.delay}
            onClose={() => removeNudge(nudge.id)}
          />
        ))}
      </AnimatePresence>

      {/* Break Suggestion Modal */}
      <BreakSuggestionModal
        isOpen={showBreakModal}
        onClose={() => setShowBreakModal(false)}
        onStartBreak={handleStartBreak}
        focusDuration={sessionDuration}
      />
    </>
  );
}

// TypeScript declaration for global window method
declare global {
  interface Window {
    triggerKaalNudge?: (nudge: Omit<Nudge, 'id'>) => void;
  }
}