-- Fix security issue with task_stats view
-- This migration removes SECURITY DEFINER from the task_stats view
-- and recreates it with SECURITY INVOKER (default, more secure)

-- Drop the existing view
DROP VIEW IF EXISTS task_stats CASCADE;

-- Recreate the view WITHOUT SECURITY DEFINER
-- This means the view will use the permissions of the querying user,
-- not the view creator, which is more secure and respects RLS policies
CREATE VIEW task_stats 
WITH (security_invoker = true)
AS
SELECT 
  user_id,
  COUNT(*) FILTER (WHERE status = 'todo') as todo_count,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  COUNT(*) FILTER (WHERE status = 'archived') as archived_count,
  COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_count,
  COUNT(*) FILTER (WHERE priority = 'high') as high_priority_count,
  COUNT(*) FILTER (WHERE due_date < NOW() AND status NOT IN ('completed', 'archived')) as overdue_count
FROM tasks
GROUP BY user_id;

-- Grant appropriate permissions to authenticated users
GRANT SELECT ON task_stats TO authenticated;
GRANT SELECT ON task_stats TO anon;

-- Note: Since this view uses SECURITY INVOKER (default behavior),
-- it will automatically respect the RLS policies on the underlying tasks table.
-- Users can only see statistics for tasks they have permission to access.
