import { useEffect, useRef, useState, ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Loader2 } from "lucide-react";

interface InfiniteScrollProps {
  children: ReactNode;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  loader?: ReactNode;
  endMessage?: ReactNode;
  threshold?: number;
  className?: string;
}

export function InfiniteScroll({
  children,
  hasMore,
  isLoading,
  onLoadMore,
  loader,
  endMessage,
  threshold = 200,
  className = "",
}: InfiniteScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

      if (distanceFromBottom < threshold && hasMore && !isLoading) {
        setShouldLoad(true);
      }
    };

    container.addEventListener("scroll", handleScroll);
    // Check on mount in case content is already short
    handleScroll();

    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasMore, isLoading, threshold]);

  useEffect(() => {
    if (shouldLoad && hasMore && !isLoading) {
      onLoadMore();
      setShouldLoad(false);
    }
  }, [shouldLoad, hasMore, isLoading, onLoadMore]);

  const defaultLoader = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-center py-8"
    >
      <div className="flex flex-col items-center gap-3">
        <Loader2 
          className="w-8 h-8 animate-spin" 
          style={{ color: "#667EEA" }}
        />
        <p className="text-sm font-medium" style={{ color: "#9CA3AF" }}>
          Loading more...
        </p>
      </div>
    </motion.div>
  );

  const defaultEndMessage = (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex items-center justify-center py-8"
    >
      <div 
        className="px-6 py-3 rounded-full border"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.6)",
          borderColor: "rgba(0, 0, 0, 0.08)",
          color: "#6B7280"
        }}
      >
        <p className="text-sm font-medium">
          ✓ All items loaded
        </p>
      </div>
    </motion.div>
  );

  return (
    <div ref={containerRef} className={`overflow-y-auto ${className}`}>
      {children}
      
      <AnimatePresence mode="wait">
        {isLoading && (
          <div key="loader">
            {loader || defaultLoader}
          </div>
        )}
        
        {!hasMore && !isLoading && (
          <div key="end">
            {endMessage || defaultEndMessage}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Loading skeleton for tasks
export function TaskSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-2xl p-4 border mb-3"
      style={{
        background: "rgba(255, 255, 255, 0.4)",
        borderColor: "rgba(255, 255, 255, 0.5)"
      }}
    >
      <div className="flex items-center gap-3">
        <div 
          className="w-5 h-5 rounded border animate-pulse"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.05)" }}
        />
        <div className="flex-1 space-y-2">
          <div 
            className="h-4 rounded animate-pulse"
            style={{ 
              backgroundColor: "rgba(0, 0, 0, 0.05)",
              width: "70%" 
            }}
          />
          <div 
            className="h-3 rounded animate-pulse"
            style={{ 
              backgroundColor: "rgba(0, 0, 0, 0.03)",
              width: "40%" 
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// Loading skeleton for generic cards
export function CardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-3xl p-6 border"
      style={{
        background: "rgba(255, 255, 255, 0.4)",
        borderColor: "rgba(255, 255, 255, 0.5)"
      }}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-2xl animate-pulse"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.05)" }}
          />
          <div className="flex-1 space-y-2">
            <div 
              className="h-5 rounded animate-pulse"
              style={{ 
                backgroundColor: "rgba(0, 0, 0, 0.05)",
                width: "60%" 
              }}
            />
            <div 
              className="h-4 rounded animate-pulse"
              style={{ 
                backgroundColor: "rgba(0, 0, 0, 0.03)",
                width: "40%" 
              }}
            />
          </div>
        </div>
        <div className="space-y-2">
          <div 
            className="h-3 rounded animate-pulse"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.03)" }}
          />
          <div 
            className="h-3 rounded animate-pulse"
            style={{ 
              backgroundColor: "rgba(0, 0, 0, 0.03)",
              width: "80%" 
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}
