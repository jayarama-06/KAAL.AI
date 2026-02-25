import { X, Brain, AlertCircle, Lightbulb, Timer } from "lucide-react";
import { motion } from "motion/react";

export type NudgeType = "coach" | "distraction" | "suggestion" | "reminder";

export interface NudgeNotificationProps {
  type: NudgeType;
  title: string;
  message: string;
  position?: "bottom-left" | "top-right" | "top-left" | "bottom-right";
  onClose: () => void;
  delay?: number; // animation delay in seconds
}

export function NudgeNotification({
  type,
  title,
  message,
  position = "bottom-left",
  onClose,
  delay = 0
}: NudgeNotificationProps) {
  const getIcon = () => {
    switch (type) {
      case "coach":
        return (
          <div 
            className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center shadow-inner border"
            style={{
              background: "linear-gradient(to bottom right, #F3F4F6, #D1D5DB)",
              borderColor: "white"
            }}
          >
            <span 
              className="font-bold text-lg"
              style={{ 
                fontFamily: "'Playfair Display', serif",
                color: "#111827"
              }}
            >
              K
            </span>
          </div>
        );
      case "distraction":
        return (
          <div 
            className="w-10 h-10 rounded-full border flex items-center justify-center shadow-sm flex-shrink-0"
            style={{
              backgroundColor: "#FFFBEB",
              borderColor: "#FED7AA"
            }}
          >
            <AlertCircle className="w-5 h-5" style={{ color: "#D97706" }} />
          </div>
        );
      case "suggestion":
        return (
          <div 
            className="w-10 h-10 rounded-full border flex items-center justify-center shadow-sm flex-shrink-0"
            style={{
              backgroundColor: "#EFF6FF",
              borderColor: "#BFDBFE"
            }}
          >
            <Lightbulb className="w-5 h-5" style={{ color: "#2563EB" }} />
          </div>
        );
      case "reminder":
        return (
          <div 
            className="w-10 h-10 rounded-full border flex items-center justify-center shadow-sm flex-shrink-0"
            style={{
              backgroundColor: "#F0FDF4",
              borderColor: "#BBF7D0"
            }}
          >
            <Timer className="w-5 h-5" style={{ color: "#16A34A" }} />
          </div>
        );
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case "coach":
        return "rgba(17, 24, 39, 0.8)";
      case "distraction":
        return "rgba(251, 191, 36, 0.5)";
      case "suggestion":
        return "rgba(59, 130, 246, 0.5)";
      case "reminder":
        return "rgba(34, 197, 94, 0.5)";
    }
  };

  const getBackgroundOverlay = () => {
    switch (type) {
      case "distraction":
        return "rgba(245, 158, 11, 0.05)";
      default:
        return "transparent";
    }
  };

  const getShadow = () => {
    switch (type) {
      case "coach":
        return "0 0 30px rgba(17, 24, 39, 0.3), 0 0 60px rgba(17, 24, 39, 0.1)";
      case "distraction":
        return "0 0 30px rgba(245, 158, 11, 0.15), 0 0 60px rgba(245, 158, 11, 0.05)";
      default:
        return "0 0 30px rgba(17, 24, 39, 0.3), 0 0 60px rgba(17, 24, 39, 0.1)";
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case "bottom-left":
        return "bottom-10 left-80";
      case "top-right":
        return "top-28 right-10";
      case "top-left":
        return "top-28 left-80";
      case "bottom-right":
        return "bottom-32 right-10";
    }
  };

  const getPulseColor = () => {
    switch (type) {
      case "distraction":
        return "#FCD34D";
      default:
        return "#111827";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ 
        duration: 0.6,
        delay,
        ease: [0.21, 1.02, 0.48, 1]
      }}
      className={`fixed z-[60] max-w-sm ${getPositionClasses()}`}
    >
      <div
        className="rounded-2xl p-4 flex items-start gap-4 relative overflow-hidden border-l-4"
        style={{
          background: "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(30px) saturate(150%)",
          WebkitBackdropFilter: "blur(30px) saturate(150%)",
          border: "1px solid rgba(255, 255, 255, 0.6)",
          borderLeftWidth: "4px",
          borderLeftColor: getBorderColor(),
          boxShadow: getShadow()
        }}
      >
        {/* Pulsing indicator dot */}
        {type === "coach" && (
          <motion.div
            className="w-2 h-2 rounded-full absolute top-4 left-[-2px]"
            style={{
              backgroundColor: "#111827",
              boxShadow: "0 0 8px rgba(0,0,0,0.3)"
            }}
            animate={{
              opacity: [1, 0.5, 1],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}

        {type === "distraction" && (
          <motion.div
            className="h-1.5 w-1.5 rounded-full absolute top-4 right-4"
            style={{
              backgroundColor: getPulseColor(),
              boxShadow: `0 0 8px ${getPulseColor()}`
            }}
            animate={{
              opacity: [1, 0.4, 1],
              scale: [1, 1.3, 1]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}

        {/* Background overlay for distraction type */}
        {type === "distraction" && (
          <div 
            className="absolute inset-0 mix-blend-overlay"
            style={{ backgroundColor: getBackgroundOverlay() }}
          />
        )}

        {/* Icon */}
        {getIcon()}

        {/* Content */}
        <div className="flex-1 relative z-10">
          {type === "coach" ? (
            <>
              <h4 
                className="text-xs font-bold uppercase tracking-widest mb-1"
                style={{ color: "rgba(17, 24, 39, 0.7)" }}
              >
                {title}
              </h4>
              <p 
                className="text-sm font-medium leading-relaxed"
                style={{ color: "#111827" }}
              >
                {message}
              </p>
            </>
          ) : (
            <>
              <h4 
                className="text-sm font-bold"
                style={{ color: "#1F2937" }}
              >
                {title}
              </h4>
              <p 
                className="text-xs mt-0.5"
                style={{ color: "#6B7280" }}
              >
                {message}
              </p>
            </>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="transition-colors"
          style={{ color: "#6B7280" }}
          onMouseEnter={(e) => e.currentTarget.style.color = "#111827"}
          onMouseLeave={(e) => e.currentTarget.style.color = "#6B7280"}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
