import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Client } from "npm:pg@8.11.3";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-05bb5681/health", (c) => {
  return c.json({ status: "ok" });
});

// Database setup endpoint - creates all necessary tables
app.post("/make-server-05bb5681/setup-database", async (c) => {
  try {
    const dbUrl = Deno.env.get('SUPABASE_DB_URL');

    if (!dbUrl) {
      return c.json({ 
        success: false, 
        error: "Database URL not configured on server. SUPABASE_DB_URL environment variable is missing." 
      }, 500);
    }

    // Connect to Postgres directly
    const client = new Client(dbUrl);
    await client.connect();

    try {
      // Drop existing tables if they exist (to ensure clean schema)
      await client.queryObject(`
        DROP TABLE IF EXISTS tasks CASCADE;
        DROP TABLE IF EXISTS focus_sessions CASCADE;
        DROP TABLE IF EXISTS energy_logs CASCADE;
        DROP TABLE IF EXISTS workspaces CASCADE;
        DROP TABLE IF EXISTS profiles CASCADE;
      `);

      // Create tasks table with snake_case columns
      await client.queryObject(`
        CREATE TABLE tasks (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          completed BOOLEAN DEFAULT FALSE,
          priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
          due_date TEXT,
          tags TEXT[],
          created_at BIGINT NOT NULL,
          completed_at BIGINT,
          estimated_minutes INTEGER,
          actual_minutes INTEGER
        );
        
        CREATE INDEX idx_tasks_completed ON tasks(completed);
        CREATE INDEX idx_tasks_priority ON tasks(priority);
        CREATE INDEX idx_tasks_due_date ON tasks(due_date);
      `);

      // Create focus_sessions table with snake_case columns
      await client.queryObject(`
        CREATE TABLE focus_sessions (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          start_time BIGINT NOT NULL,
          end_time BIGINT,
          duration INTEGER NOT NULL,
          task_ids TEXT[],
          focus_score INTEGER NOT NULL,
          energy_levels JSONB,
          context_switches INTEGER DEFAULT 0,
          notes TEXT,
          mood TEXT CHECK (mood IN ('energized', 'focused', 'tired', 'stressed'))
        );
        
        CREATE INDEX idx_sessions_start_time ON focus_sessions(start_time);
      `);

      // Create energy_logs table with snake_case columns
      await client.queryObject(`
        CREATE TABLE energy_logs (
          id TEXT PRIMARY KEY,
          timestamp BIGINT NOT NULL,
          level INTEGER NOT NULL CHECK (level >= 0 AND level <= 100),
          mood TEXT,
          notes TEXT,
          activities TEXT[]
        );
        
        CREATE INDEX idx_energy_logs_timestamp ON energy_logs(timestamp);
      `);

      // Create workspaces table with snake_case columns
      await client.queryObject(`
        CREATE TABLE workspaces (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          icon TEXT,
          apps JSONB NOT NULL DEFAULT '[]',
          tasks TEXT[],
          created_at BIGINT NOT NULL
        );
      `);

      // Create profiles table with snake_case columns
      await client.queryObject(`
        CREATE TABLE profiles (
          user_id TEXT PRIMARY KEY,
          name TEXT,
          email TEXT,
          avatar TEXT,
          work_style TEXT CHECK (work_style IN ('sprint', 'cyclic', 'marathon')),
          focus_baseline INTEGER,
          timezone TEXT,
          preferences JSONB
        );
      `);

      console.log('✅ Database tables created successfully');
      
      await client.end();
      
      return c.json({
        success: true,
        message: "All database tables created successfully (existing tables were dropped)",
        tables: ['tasks', 'focus_sessions', 'energy_logs', 'workspaces', 'profiles']
      });

    } catch (error) {
      await client.end();
      throw error;
    }

  } catch (error) {
    console.error('Database setup error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      details: error instanceof Error ? error.stack : undefined
    }, 500);
  }
});

// Check database status endpoint
app.get("/make-server-05bb5681/database-status", async (c) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return c.json({
        configured: false,
        tables: {}
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    // Check each table
    const tables = ['tasks', 'focus_sessions', 'energy_logs', 'workspaces', 'profiles'];
    const status: Record<string, boolean> = {};

    for (const table of tables) {
      const { error } = await supabase.from(table).select('count').limit(1);
      status[table] = !error || error.code !== 'PGRST204';
    }

    const allTablesExist = Object.values(status).every(exists => exists);

    return c.json({
      configured: true,
      ready: allTablesExist,
      tables: status
    });

  } catch (error) {
    return c.json({
      configured: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

Deno.serve(app.fetch);