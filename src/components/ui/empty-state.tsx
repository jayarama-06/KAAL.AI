import { LucideIcon } from 'lucide-react';
import { AccessibleButton } from './accessible-button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

/**
 * Empty State Component
 * Provides helpful guidance when no data is available
 * Improves UX by preventing confusion and providing clear next steps
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = ''
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}
      role="status"
      aria-live="polite"
    >
      {Icon && (
        <div
          className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100"
          aria-hidden="true"
        >
          <Icon className="w-12 h-12 text-gray-400" strokeWidth={1.5} />
        </div>
      )}
      
      <h3
        className="text-xl font-semibold text-[#111827] mb-2"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {title}
      </h3>
      
      <p
        className="text-base text-[#6B7280] max-w-md mb-6"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {description}
      </p>

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {actionLabel && onAction && (
            <AccessibleButton
              variant="primary"
              size="md"
              onClick={onAction}
              aria-label={actionLabel}
            >
              {actionLabel}
            </AccessibleButton>
          )}
          
          {secondaryActionLabel && onSecondaryAction && (
            <AccessibleButton
              variant="secondary"
              size="md"
              onClick={onSecondaryAction}
              aria-label={secondaryActionLabel}
            >
              {secondaryActionLabel}
            </AccessibleButton>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Specific Empty State Variations
 */

// No tasks
export function NoTasksEmptyState({ onCreateTask }: { onCreateTask: () => void }) {
  return (
    <EmptyState
      title="No tasks yet"
      description="Get started by creating your first task. Break down your work into manageable pieces and stay focused."
      actionLabel="Create your first task"
      onAction={onCreateTask}
    />
  );
}

// No search results
export function NoSearchResultsEmptyState({ searchQuery, onClearSearch }: { searchQuery: string; onClearSearch: () => void }) {
  return (
    <EmptyState
      title="No results found"
      description={`We couldn't find any tasks matching "${searchQuery}". Try adjusting your search or clear the filter.`}
      actionLabel="Clear search"
      onAction={onClearSearch}
    />
  );
}

// No backlog items
export function NoBacklogEmptyState({ onAddBacklog }: { onAddBacklog: () => void }) {
  return (
    <EmptyState
      title="Your backlog is empty"
      description="Capture ideas, future tasks, and things you want to remember for later. Your backlog helps you stay organized without cluttering your main workspace."
      actionLabel="Add to backlog"
      onAction={onAddBacklog}
    />
  );
}

// No calendar events
export function NoEventsEmptyState({ onCreateEvent }: { onCreateEvent: () => void }) {
  return (
    <EmptyState
      title="No events scheduled"
      description="Stay on top of your schedule by adding meetings, deadlines, and important dates to your calendar."
      actionLabel="Create event"
      onAction={onCreateEvent}
    />
  );
}

// Connection error
export function ConnectionErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <EmptyState
      title="Connection error"
      description="We're having trouble connecting to the server. Please check your internet connection and try again."
      actionLabel="Retry"
      onAction={onRetry}
    />
  );
}
