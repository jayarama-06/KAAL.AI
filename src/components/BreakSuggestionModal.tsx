import { useState } from "react";
import { Play, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface BreakSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartBreak?: () => void;
  focusDuration?: number; // in minutes
}

export function BreakSuggestionModal({ 
  isOpen, 
  onClose, 
  onStartBreak,
  focusDuration = 90 
}: BreakSuggestionModalProps) {
  const handleStartBreak = () => {
    onStartBreak?.();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            backgroundColor: "rgba(0, 0, 0, 0.1)"
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.4, ease: [0.21, 1.02, 0.48, 1] }}
            className="w-full max-w-lg rounded-3xl p-8 relative overflow-hidden"
            style={{
              background: "rgba(255, 255, 255, 0.85)",
              backdropFilter: "blur(40px) saturate(200%)",
              WebkitBackdropFilter: "blur(40px) saturate(200%)",
              border: "1px solid rgba(255, 255, 255, 0.8)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative background blobs */}
            <div 
              className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16"
              style={{ backgroundColor: "rgba(96, 165, 250, 0.1)" }}
            />
            <div 
              className="absolute bottom-0 left-0 w-24 h-24 rounded-full blur-2xl -ml-12 -mb-12"
              style={{ backgroundColor: "rgba(168, 85, 247, 0.1)" }}
            />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 transition-colors z-10"
              style={{ color: "#6B7280" }}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="text-center relative z-10">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm ring-1"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.5)",
                  ringColor: "rgba(255, 255, 255, 0.6)"
                }}
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <svg 
                    className="w-8 h-8"
                    style={{ color: "#111827" }}
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5.5-2.5l7.51-3.49L17.5 6.5 9.99 9.99 6.5 17.5zm5.5-6.6c.61 0 1.1.49 1.1 1.1s-.49 1.1-1.1 1.1-1.1-.49-1.1-1.1.49-1.1 1.1-1.1z"/>
                  </svg>
                </motion.div>
              </div>

              <h3 
                className="text-3xl mb-2"
                style={{ 
                  fontFamily: "'Playfair Display', serif",
                  color: "#111827"
                }}
              >
                Time for a Pause
              </h3>
              
              <p 
                className="font-light text-lg mb-8 max-w-xs mx-auto"
                style={{ color: "#6B7280" }}
              >
                You've been in deep focus for {focusDuration} minutes. A quick reset can boost your cognitive load.
              </p>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl border transition-colors font-medium text-sm"
                  style={{
                    backgroundColor: "white",
                    borderColor: "#E5E7EB",
                    color: "#6B7280"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#111827";
                    e.currentTarget.style.borderColor = "#D1D5DB";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#6B7280";
                    e.currentTarget.style.borderColor = "#E5E7EB";
                  }}
                >
                  Dismiss
                </button>
                
                <button
                  onClick={handleStartBreak}
                  className="px-6 py-3 rounded-xl shadow-lg transition-colors font-medium text-sm flex items-center gap-2"
                  style={{
                    backgroundColor: "#111827",
                    color: "white"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#1F2937";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#111827";
                  }}
                >
                  <Play className="w-4 h-4" />
                  Start 5m Break
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
