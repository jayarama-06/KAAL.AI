-- ====================================
-- KAAL Security Fixes - Apply All
-- ====================================

-- Fix 1: task_stats view (SECURITY INVOKER)
DROP VIEW IF EXISTS task_stats CASCADE;

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

GRANT SELECT ON task_stats TO authenticated;
GRANT SELECT ON task_stats TO anon;

-- Fix 2: update_updated_at_column function (search_path)
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_comments_updated_at
  BEFORE UPDATE ON task_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Fix 3: log_task_changes function (search_path)
DROP FUNCTION IF EXISTS log_task_changes() CASCADE;

CREATE OR REPLACE FUNCTION log_task_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO task_history (task_id, user_id, action, changes)
    VALUES (NEW.id, NEW.user_id, 'created', to_jsonb(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF (OLD.status != 'completed' AND NEW.status = 'completed') THEN
      INSERT INTO task_history (task_id, user_id, action, changes)
      VALUES (NEW.id, NEW.user_id, 'completed', jsonb_build_object('completed_at', NEW.completed_at));
    ELSIF (OLD.status = 'completed' AND NEW.status != 'completed') THEN
      INSERT INTO task_history (task_id, user_id, action, changes)
      VALUES (NEW.id, NEW.user_id, 'reopened', jsonb_build_object('status', NEW.status));
    ELSE
      INSERT INTO task_history (task_id, user_id, action, changes)
      VALUES (NEW.id, NEW.user_id, 'updated', 
        jsonb_build_object(
          'old', to_jsonb(OLD),
          'new', to_jsonb(NEW)
        )
      );
    END IF;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO task_history (task_id, user_id, action, changes)
    VALUES (OLD.id, OLD.user_id, 'deleted', to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = '';

CREATE TRIGGER log_task_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_task_changes();

-- ====================================
-- Success!
-- ====================================
SELECT '✅ All security fixes applied successfully!' as status;
