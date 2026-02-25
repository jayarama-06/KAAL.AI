# 🚀 KAAL Deployment Guide

Complete guide for deploying KAAL to production.

---

## 📋 Pre-Deployment Checklist

### ✅ Code Ready
- [ ] All features tested locally
- [ ] No console errors or warnings
- [ ] Build completes without errors: `npm run build`
- [ ] Environment variables documented

### ✅ Supabase Setup
- [ ] Supabase project created
- [ ] All migrations applied (7 files)
- [ ] Row Level Security (RLS) enabled on all tables
- [ ] Edge Functions deployed (`generate-nudge`)
- [ ] `GEMINI_API_KEY` secret configured
- [ ] Supabase URL and Anon Key available

### ✅ External Services
- [ ] Google Gemini API key obtained
- [ ] (Optional) Google Calendar API credentials
- [ ] Domain name registered (if custom domain)

---

## 🗄️ Supabase Setup (Detailed)

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click **"New Project"**
3. Fill in:
   - **Name**: KAAL Production
   - **Database Password**: (strong password, save it!)
   - **Region**: Choose closest to your users
4. Wait for project initialization (~2 minutes)

### Step 2: Run Database Migrations

1. Open **SQL Editor** in Supabase Dashboard
2. Run migrations **in order**:

**001_mvp_schema.sql**
```sql
-- Copy and paste content from /supabase/migrations/001_mvp_schema.sql
-- Click "Run"
-- Verify: Tables created (user_profiles, tasks, focus_sessions, etc.)
```

**002_fix_focus_sessions_schema.sql**
```sql
-- Run this migration
-- Verify: focus_sessions table has correct columns
```

**003_proactive_intelligence_corrected.sql**
```sql
-- Run this migration
-- Verify: AI tables created (nudge_events, behavioral_baselines, etc.)
```

**004_apply_all_security_fixes.sql**
```sql
-- Run this migration
-- Verify: RLS policies created (check Authentication → Policies)
```

**005_add_missing_tables.sql**
```sql
-- Run this migration
-- Verify: All 19 tables exist
```

**006_sync_profile_from_auth_metadata.sql**
```sql
-- Run this migration
-- Verify: Profile sync trigger created
```

**007_nudge_events.sql**
```sql
-- Run this migration
-- Verify: nudge_events table has all columns
```

3. **Verify all tables exist**:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

Expected output (19 tables):
- user_profiles
- tasks
- focus_sessions
- pomodoros
- daily_logs
- weekly_reviews
- energy_logs
- distractions
- calendar_events
- reminders
- backlog_items
- user_settings
- ai_chat_history
- nudge_events
- behavioral_baselines
- context_snapshots
- ai_interventions
- cognitive_modes
- task_stats

### Step 3: Deploy Edge Functions

**Install Supabase CLI**
```bash
npm install -g supabase
```

**Login to Supabase**
```bash
supabase login
```

**Link your project**
```bash
# Get your project ref from Supabase Dashboard → Settings → General
supabase link --project-ref your-project-ref-here
```

**Deploy generate-nudge function**
```bash
supabase functions deploy generate-nudge
```

**Set Gemini API Key secret**
```bash
# IMPORTANT: This is admin-only, DO NOT expose to client
supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here
```

**Test Edge Function**
```bash
curl -X POST \
  'https://your-project.supabase.co/functions/v1/generate-nudge' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -d '{
    "task_title": "Test task",
    "estimated_minutes": 25,
    "nudge_type": "gentle",
    "energy_level": 2,
    "cognitive_mode": "deep_focus",
    "tasks_done_today": 3,
    "minutes_overdue": 30,
    "history_hint": "User completes tasks in morning"
  }'
```

Expected response:
```json
{
  "message": "Test task is ready when you are. What would make starting easier right now?",
  "fallback": false
}
```

### Step 4: Configure Authentication

1. Go to **Authentication → Providers**
2. Enable **Email** provider
3. (Optional) Configure **OAuth providers**:
   - Google
   - GitHub
   - Apple
4. Set **Site URL**: `https://yourdomain.com`
5. Add **Redirect URLs**:
   - `https://yourdomain.com/auth/callback`
   - `http://localhost:5173/auth/callback` (for local dev)

### Step 5: Enable RLS Policies

1. Go to **Authentication → Policies**
2. Verify policies exist for each table
3. Test policy: Create test user, check data isolation

---

## 🌐 Vercel Deployment (Recommended)

### Why Vercel?
- Automatic HTTPS
- Global CDN
- Git integration
- Environment variable management
- Zero configuration

### Deployment Steps

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
# From project root
vercel --prod
```

4. **Set Environment Variables**

Go to Vercel Dashboard → Project → Settings → Environment Variables

Add:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

5. **Configure Custom Domain** (optional)
   - Go to **Settings → Domains**
   - Add your domain
   - Update DNS records as instructed

6. **Enable Git Integration**
   - Connect GitHub repository
   - Auto-deploy on push to `main` branch

### Vercel Configuration

Create `vercel.json` (optional):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 🎯 Netlify Deployment

### Deployment Steps

1. **Install Netlify CLI**
```bash
npm install -g netlify-cli
```

2. **Login to Netlify**
```bash
netlify login
```

3. **Initialize Netlify**
```bash
netlify init
```

4. **Deploy**
```bash
netlify deploy --prod
```

5. **Set Environment Variables**

Go to Netlify Dashboard → Site Settings → Environment Variables

Add:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### Netlify Configuration

The project includes `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## 🐳 Docker Deployment (Advanced)

### Create Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Create nginx.conf

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

### Build and Run

```bash
docker build -t kaal-app .
docker run -p 8080:80 kaal-app
```

---

## 🔒 Security Best Practices

### Environment Variables

**✅ DO:**
- Store secrets in platform environment variables (Vercel/Netlify)
- Use `VITE_` prefix for client-exposed variables
- Keep Supabase anon key public (it's designed for this)
- Store Gemini API key in Supabase Edge Function secrets

**❌ DON'T:**
- Commit `.env` files to Git
- Expose Supabase service role key to client
- Store API keys in client-side code
- Use production credentials in development

### Supabase Security

1. **Enable RLS on all tables**
2. **Limit anon key permissions** (only necessary endpoints)
3. **Use JWT token expiration** (default 1 hour)
4. **Enable email verification** for new users
5. **Set up rate limiting** in Supabase dashboard

---

## 📊 Post-Deployment Monitoring

### Vercel Analytics

```bash
# Install Vercel Analytics
npm install @vercel/analytics

# Add to App.tsx
import { Analytics } from '@vercel/analytics/react';

function App() {
  return (
    <>
      <YourApp />
      <Analytics />
    </>
  );
}
```

### Supabase Monitoring

1. **Database Performance**
   - Go to **Database → Performance**
   - Monitor slow queries
   - Check connection pool usage

2. **Edge Function Logs**
   - Go to **Edge Functions → Logs**
   - Check for errors
   - Monitor invocation count

3. **Auth Activity**
   - Go to **Authentication → Users**
   - Monitor sign-ups
   - Check failed login attempts

### Error Tracking (Optional)

**Sentry Integration**
```bash
npm install @sentry/react @sentry/vite-plugin
```

Add to `main.tsx`:
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

---

## 🚨 Troubleshooting

### Build Errors

**Problem**: TypeScript errors during build
```bash
npm run build
```

**Solution**:
```bash
# Check for type errors
npx tsc --noEmit

# Fix imports
# Ensure all imports use correct paths
```

### Supabase Connection Errors

**Problem**: "Failed to fetch" or CORS errors

**Solution**:
1. Check environment variables are set correctly
2. Verify Supabase URL includes `https://`
3. Check RLS policies allow anon access where needed
4. Add your domain to Supabase allowed origins

### Edge Function Errors

**Problem**: Nudges not generating

**Solution**:
1. Check Edge Function deployment: `supabase functions list`
2. Verify `GEMINI_API_KEY` secret: `supabase secrets list`
3. Check Edge Function logs in Supabase Dashboard
4. Test API key with curl (see Step 3 above)

### Performance Issues

**Problem**: Slow page loads

**Solution**:
1. Enable Vercel/Netlify Edge CDN
2. Optimize images (use WebP format)
3. Lazy load routes with React.lazy()
4. Check Supabase database indexes
5. Enable Supabase connection pooling

---

## 📝 Deployment Checklist

### Pre-Deploy
- [ ] Run `npm run build` successfully
- [ ] Test all features locally
- [ ] Review environment variables
- [ ] Update Supabase migration files

### Supabase
- [ ] Project created
- [ ] All 7 migrations applied
- [ ] RLS policies enabled
- [ ] Edge Functions deployed
- [ ] Secrets configured
- [ ] Authentication providers enabled

### Platform (Vercel/Netlify)
- [ ] Environment variables set
- [ ] Custom domain configured (if applicable)
- [ ] HTTPS enabled
- [ ] Git integration configured
- [ ] Build settings verified

### Post-Deploy
- [ ] Test authentication flow
- [ ] Create test task
- [ ] Start focus session
- [ ] Verify nudge notifications
- [ ] Check analytics data
- [ ] Test on mobile devices
- [ ] Set up monitoring

---

## 🎉 Success!

Your KAAL app is now live! 🚀

**Next Steps:**
1. Share your deployment URL
2. Invite beta testers
3. Monitor performance metrics
4. Collect user feedback
5. Iterate and improve

**Support:**
- Documentation: [README.md](README.md)
- Issues: [GitHub Issues](https://github.com/aama47735-source/KAAL/issues)
- Email: jayaram.a-29@soai.saiuniversity.edu.in

---

<div align="center">

**Built with ❤️ for the SAI University FOSS Club Hackathon 2026**

</div>