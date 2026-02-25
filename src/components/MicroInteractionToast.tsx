import { useState, useEffect } from "react";
import { X, Clock } from "lucide-react";
import { microInteractions, type MicroInteraction } from "../services/micro-interaction-service";
import { motion, AnimatePresence } from "motion/react";

interface MicroInteractionToastProps {
  userId: string;
  onResponse?: (interactionId: string, value: any) => void;
}

export function MicroInteractionToast({ userId, onResponse }: MicroInteractionToastProps) {
  const [currentInteraction, setCurrentInteraction] = useState<MicroInteraction | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check for pending interactions every 30 seconds
    const checkInterval = setInterval(() => {
      checkForInteractions();
    }, 30000);

    // Check immediately on mount
    checkForInteractions();

    return () => clearInterval(checkInterval);
  }, [userId]);

  const checkForInteractions = async () => {
    if (currentInteraction) return; // Don't show multiple at once

    const pending = await microInteractions.getPendingInteractions(userId);
    if (pending.length > 0) {
      setCurrentInteraction(pending[0]);
      setIsVisible(true);
    }
  };

  const handleResponse = async (value: any) => {
    if (!currentInteraction) return;

    await microInteractions.respondToInteraction(userId, currentInteraction.id, { value });
    
    if (onResponse) {
      onResponse(currentInteraction.id, value);
    }

    // Hide and clear
    setIsVisible(false);
    setTimeout(() => {
      setCurrentInteraction(null);
      // Check for next interaction after 15 seconds
      setTimeout(checkForInteractions, 15000);
    }, 300);
  };

  const handleSkip = async () => {
    if (!currentInteraction) return;

    await microInteractions.skipInteraction(userId, currentInteraction.id);
    setIsVisible(false);
    setTimeout(() => {
      setCurrentInteraction(null);
      setTimeout(checkForInteractions, 15000);
    }, 300);
  };

  const handleSnooze = async () => {
    if (!currentInteraction) return;

    await microInteractions.snoozeInteraction(userId, currentInteraction.id, 15);
    setIsVisible(false);
    setTimeout(() => {
      setCurrentInteraction(null);
      setTimeout(checkForInteractions, 15 * 60 * 1000); // Check again in 15 minutes
    }, 300);
  };

  if (!currentInteraction) return null;

  const getInteractionStyle = () => {
    switch (currentInteraction.type) {
      case 'celebration':
        return {
          gradient: 'linear-gradient(135deg, #F59E0B, #EF4444)',
          emoji: '🎉',
        };
      case 'state_triggered':
        return {
          gradient: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
          emoji: '💡',
        };
      case 'scheduled':
        return {
          gradient: 'linear-gradient(135deg, #10B981, #3B82F6)',
          emoji: '👋',
        };
      default:
        return {
          gradient: 'linear-gradient(135deg, #6B7280, #374151)',
          emoji: '✨',
        };
    }
  };

  const style = getInteractionStyle();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.9 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed bottom-8 right-8 z-50 max-w-md"
          style={{ width: '380px' }}
        >
          <div
            className="rounded-2xl shadow-2xl border border-white/20 overflow-hidden backdrop-blur-xl"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
            }}
          >
            {/* Header with gradient */}
            <div
              className="p-4 text-white relative overflow-hidden"
              style={{ background: style.gradient }}
            >
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{style.emoji}</span>
                  <span className="font-semibold text-sm">KAAL wants to know</span>
                </div>
                <button
                  onClick={handleSkip}
                  className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Decorative gradient orb */}
              <div
                className="absolute -right-8 -top-8 w-24 h-24 rounded-full blur-2xl opacity-30"
                style={{ background: 'white' }}
              />
            </div>

            {/* Content */}
            <div className="p-6">
              <h3 className="text-lg font-bold text-[#111827] mb-4">
                {currentInteraction.question}
              </h3>

              {/* Response Options */}
              <div className="space-y-2">
                {currentInteraction.responseType === 'yes_no' && currentInteraction.options && (
                  <div className="grid grid-cols-1 gap-2">
                    {currentInteraction.options.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleResponse(option.value)}
                        className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
                      >
                        {option.emoji && <span className="text-xl">{option.emoji}</span>}
                        <span className="font-medium text-[#111827]">{option.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {currentInteraction.responseType === 'emoji' && currentInteraction.options && (
                  <div className="flex justify-between gap-2">
                    {currentInteraction.options.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleResponse(option.value)}
                        className="flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all"
                      >
                        <span className="text-3xl">{option.emoji}</span>
                        <span className="text-xs font-medium text-[#6B7280]">{option.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {currentInteraction.responseType === 'scale' && currentInteraction.options && (
                  <div className="flex justify-between gap-2">
                    {currentInteraction.options.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleResponse(option.value)}
                        className="flex-1 p-3 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-center font-medium text-sm"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}

                {currentInteraction.responseType === 'multi_choice' && currentInteraction.options && (
                  <div className="grid grid-cols-1 gap-2">
                    {currentInteraction.options.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleResponse(option.value)}
                        className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
                      >
                        {option.emoji && <span className="text-xl">{option.emoji}</span>}
                        <span className="font-medium text-[#111827]">{option.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={handleSnooze}
                  className="flex items-center gap-1 text-xs font-medium text-[#6B7280] hover:text-[#111827] transition-colors"
                >
                  <Clock className="w-3 h-3" />
                  Ask me later (15 min)
                </button>
                <button
                  onClick={handleSkip}
                  className="text-xs font-medium text-[#6B7280] hover:text-[#111827] transition-colors"
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
