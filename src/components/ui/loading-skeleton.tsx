import { cn } from './utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string;
  height?: string;
  count?: number;
}

/**
 * Loading Skeleton Component
 * Provides visual feedback during data loading
 * Improves perceived performance and UX
 */
export function Skeleton({ 
  className, 
  variant = 'rectangular', 
  width, 
  height,
  count = 1 
}: SkeletonProps) {
  const variants = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    card: 'rounded-xl h-32'
  };

  const skeletons = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={cn(
        'animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]',
        variants[variant],
        className
      )}
      style={{ 
        width: width || '100%', 
        height: height || (variant === 'text' ? '1rem' : undefined),
        animation: 'shimmer 2s infinite'
      }}
      role="status"
      aria-label="Loading..."
    />
  ));

  return count > 1 ? <div className="space-y-3">{skeletons}</div> : skeletons[0];
}

/**
 * Task Card Skeleton
 */
export function TaskCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="Loading tasks...">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
        >
          <div className="flex items-start gap-4">
            <Skeleton variant="circular" width="20px" height="20px" />
            <div className="flex-1 space-y-3">
              <Skeleton variant="text" width="60%" height="20px" />
              <Skeleton variant="text" width="90%" height="16px" />
              <Skeleton variant="text" width="40%" height="14px" />
            </div>
          </div>
        </div>
      ))}
      <span className="sr-only">Loading tasks...</span>
    </div>
  );
}

/**
 * Dashboard Stats Skeleton
 */
export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6" role="status" aria-label="Loading statistics...">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
        >
          <Skeleton variant="text" width="40%" height="14px" className="mb-3" />
          <Skeleton variant="text" width="60%" height="32px" className="mb-2" />
          <Skeleton variant="text" width="50%" height="12px" />
        </div>
      ))}
      <span className="sr-only">Loading statistics...</span>
    </div>
  );
}

/**
 * Profile Skeleton
 */
export function ProfileSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm" role="status" aria-label="Loading profile...">
      <div className="flex items-center gap-6 mb-6">
        <Skeleton variant="circular" width="80px" height="80px" />
        <div className="flex-1 space-y-3">
          <Skeleton variant="text" width="200px" height="24px" />
          <Skeleton variant="text" width="300px" height="16px" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton variant="text" width="100%" height="40px" />
        <Skeleton variant="text" width="100%" height="40px" />
        <Skeleton variant="text" width="100%" height="100px" />
      </div>
      <span className="sr-only">Loading profile...</span>
    </div>
  );
}

// Add shimmer animation to globals.css
export const shimmerKeyframes = `
  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;
