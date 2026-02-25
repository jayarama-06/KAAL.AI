-- Add missing tables for task management
-- This migration adds projects, task_comments, and task_history tables

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  icon TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task comments table
CREATE TABLE IF NOT EXISTS task_comments (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task history table (for audit logging)
CREATE TABLE IF NOT EXISTS task_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'completed', 'deleted', 'status_changed')),
  changes JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to tasks table if they don't exist
DO $$ 
BEGIN
  -- Add user_id column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='tasks' AND column_name='user_id') THEN
    ALTER TABLE tasks ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Add status column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='tasks' AND column_name='status') THEN
    ALTER TABLE tasks ADD COLUMN status TEXT DEFAULT 'todo' 
      CHECK (status IN ('todo', 'in_progress', 'completed', 'archived'));
  END IF;

  -- Add project_id column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='tasks' AND column_name='project_id') THEN
    ALTER TABLE tasks ADD COLUMN project_id TEXT REFERENCES projects(id) ON DELETE SET NULL;
  END IF;

  -- Add updated_at column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='tasks' AND column_name='updated_at') THEN
    ALTER TABLE tasks ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
DROP POLICY IF EXISTS "Allow all operations" ON projects;
CREATE POLICY "Users can view their own projects" 
  ON projects FOR SELECT 
  USING (true); -- Allow all for now, can be restricted to: auth.uid() = user_id

CREATE POLICY "Users can create their own projects" 
  ON projects FOR INSERT 
  WITH CHECK (true); -- Can be restricted to: auth.uid() = user_id

CREATE POLICY "Users can update their own projects" 
  ON projects FOR UPDATE 
  USING (true); -- Can be restricted to: auth.uid() = user_id

CREATE POLICY "Users can delete their own projects" 
  ON projects FOR DELETE 
  USING (true); -- Can be restricted to: auth.uid() = user_id

-- RLS Policies for task_comments
DROP POLICY IF EXISTS "Allow all operations" ON task_comments;
CREATE POLICY "Users can view all comments" 
  ON task_comments FOR SELECT 
  USING (true);

CREATE POLICY "Users can create comments" 
  ON task_comments FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update their own comments" 
  ON task_comments FOR UPDATE 
  USING (true);

CREATE POLICY "Users can delete their own comments" 
  ON task_comments FOR DELETE 
  USING (true);

-- RLS Policies for task_history
DROP POLICY IF EXISTS "Allow all operations" ON task_history;
CREATE POLICY "Users can view all history" 
  ON task_history FOR SELECT 
  USING (true);

CREATE POLICY "System can insert history" 
  ON task_history FOR INSERT 
  WITH CHECK (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger to update updated_at on tasks
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at on projects
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to log task changes to task_history
CREATE OR REPLACE FUNCTION log_task_changes()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO task_history (task_id, user_id, action, changes)
    VALUES (NEW.id, NEW.user_id, 'created', to_jsonb(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Log status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO task_history (task_id, user_id, action, changes)
      VALUES (NEW.id, NEW.user_id, 'status_changed', 
              jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status));
    END IF;
    
    -- Log completion
    IF OLD.completed = false AND NEW.completed = true THEN
      INSERT INTO task_history (task_id, user_id, action, changes)
      VALUES (NEW.id, NEW.user_id, 'completed', 
              jsonb_build_object('completed_at', NEW.completed_at));
    END IF;
    
    -- Log general updates
    INSERT INTO task_history (task_id, user_id, action, changes)
    VALUES (NEW.id, NEW.user_id, 'updated', 
            jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW)));
    
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO task_history (task_id, user_id, action, changes)
    VALUES (OLD.id, OLD.user_id, 'deleted', to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger to log task changes
DROP TRIGGER IF EXISTS log_task_changes_trigger ON tasks;
CREATE TRIGGER log_task_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_task_changes();

-- Create view for task statistics
CREATE OR REPLACE VIEW task_stats AS
SELECT
  user_id,
  COUNT(*) FILTER (WHERE status = 'todo') as todo_count,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  COUNT(*) FILTER (WHERE status = 'archived') as archived_count,
  COUNT(*) FILTER (WHERE priority = 'high') as high_priority_count,
  COUNT(*) FILTER (WHERE priority = 'medium') as medium_priority_count,
  COUNT(*) FILTER (WHERE priority = 'low') as low_priority_count,
  AVG(estimated_minutes) FILTER (WHERE status = 'completed') as avg_completion_time
FROM tasks
GROUP BY user_id;

-- Make the view secure with SECURITY INVOKER
ALTER VIEW task_stats SET (security_invoker = true);

-- Grant necessary permissions
GRANT SELECT ON task_stats TO authenticated;
GRANT SELECT ON task_stats TO anon;
