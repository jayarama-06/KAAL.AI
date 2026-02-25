# 🚀 KAAL Setup Guide - Production Deployment

This guide walks you through setting up KAAL for production deployment.

---

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Git installed
- Code editor (VS Code recommended)

---

## 🔧 Step-by-Step Setup

### **Step 1: Clone Repository**

```bash
git clone https://github.com/yourusername/kaal.git
cd kaal
```

### **Step 2: Install Dependencies**

```bash
npm install
```

### **Step 3: Environment Variables**

1. Copy the example environment file:
```bash
cp .env.example .env.local
```

2. Open `.env.local` in your editor

3. Fill in required values (see below for how to get each)

---

## 🔑 Getting Your API Keys

### **1. Supabase (Required)**

**Create Project:**
1. Go to https://supabase.com/
2. Click "New Project"
3. Choose organization and project name
4. Wait for project to provision

**Get Credentials:**
1. Go to Project Settings → API
2. Copy **Project URL** → Add as `VITE_SUPABASE_URL`
3. Copy **anon/public key** → Add as `VITE_SUPABASE_ANON_KEY`

**Run Database Migrations:**
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref-from-url

# Push migrations
supabase db push
```

Or manually run SQL files from `/supabase/migrations/` in Supabase SQL Editor.

---

### **2. Google Analytics 4 (Optional)**

**Create Property:**
1. Go to https://analytics.google.com/
2. Admin → Create Property
3. Enter property details
4. Create **Web** data stream
5. Copy **Measurement ID** (format: `G-XXXXXXXXXX`)
6. Add to `.env.local` as `VITE_GA4_MEASUREMENT_ID`
7. Update `/index.html` line 12 and 16

---

### **3. Microsoft Clarity (Optional)**

**Create Project:**
1. Go to https://clarity.microsoft.com/
2. Click "Add new project"
3. Enter website URL and project name
4. Copy **Project ID** (10 characters)
5. Add to `.env.local` as `VITE_CLARITY_PROJECT_ID`
6. Update `/index.html` line 26

---

### **4. Mixpanel (Optional)**

**Create Project:**
1. Go to https://mixpanel.com/
2. Sign up or log in
3. Create new project
4. Go to Project Settings → Project Token
5. Copy **Project Token** (32 characters)
6. Add to `.env.local` as `VITE_MIXPANEL_TOKEN`
7. Update `/index.html` line 38

---

### **5. Sentry (Optional)**

**Create Project:**
1. Go to https://sentry.io/
2. Create account or log in
3. Create new project → Select **React**
4. Copy **DSN** (URL with key)
5. Add to `.env.local` as `VITE_SENTRY_DSN`
6. Update `/services/sentry-config.ts` line with DSN

---

### **6. Google Calendar (Optional)**

**Enable API:**
1. Go to https://console.cloud.google.com/
2. Create new project or select existing
3. Enable **Google Calendar API**
4. Create **OAuth 2.0 Client ID**
5. Add `http://localhost:5173` to authorized origins (development)
6. Copy **Client ID**
7. Add to `.env.local` as `VITE_GOOGLE_CLIENT_ID`

---

### **7. OneSignal (Optional)**

**Create App:**
1. Go to https://onesignal.com/
2. Create new app
3. Select **Web Push**
4. Go to Settings → Keys & IDs
5. Copy **App ID**
6. Add to `.env.local` as `VITE_ONESIGNAL_APP_ID`

---

## 📝 Update Configuration Files

### **1. Update `/index.html`**

Replace placeholders with your actual values:

```html
<!-- Line 12: Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=YOUR_GA4_ID"></script>

<!-- Line 16: GA4 Config -->
gtag('config', 'YOUR_GA4_ID');

<!-- Line 26: Clarity -->
})(window, document, "clarity", "script", "YOUR_CLARITY_ID");

<!-- Line 38: Mixpanel -->
mixpanel.init('YOUR_MIXPANEL_TOKEN', {
```

**Option:** Use the template file:
```bash
cp index.html.template index.html
# Then edit index.html with your actual values
```

### **2. Update `/services/sentry-config.ts`**

```typescript
// Line ~15
dsn: 'YOUR_SENTRY_DSN',
```

---

## 🧪 Test Your Setup

### **Start Development Server:**

```bash
npm run dev
```

### **Check Console:**

Open http://localhost:5173 and check browser console for:

```
✅ Supabase connected
✅ Google Analytics initialized
✅ Clarity initialized
✅ Mixpanel Analytics initialized
✅ Sentry initialized
```

### **Test Features:**

1. **Sign Up:** Create account (tests Supabase)
2. **Create Task:** Add a task (tests database)
3. **Navigate:** Go to different pages (tests analytics)
4. **Check Dashboards:** Verify events appear in analytics platforms

---

## 🚀 Deploy to Production

### **Build Application:**

```bash
npm run build
```

This creates a `dist/` folder with production files.

### **Deploy Options:**

#### **Netlify (Recommended)**

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Deploy:
```bash
netlify deploy --prod
```

3. Configure:
- Build command: `npm run build`
- Publish directory: `dist`
- Add environment variables in Netlify dashboard

#### **Vercel**

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel --prod
```

3. Add environment variables in Vercel dashboard

#### **Other Platforms**

KAAL is a static site. Upload `dist/` folder to:
- GitHub Pages
- Cloudflare Pages
- AWS S3 + CloudFront
- Any static hosting

---

## 🔒 Security Checklist

- [ ] `.env.local` is in `.gitignore`
- [ ] No API keys in git history
- [ ] Supabase RLS policies enabled
- [ ] Analytics opt-out implemented
- [ ] HTTPS enabled in production
- [ ] Environment variables set in hosting platform
- [ ] Sensitive data removed from public files

---

## 📊 Verify Analytics

### **Google Analytics:**
1. Go to https://analytics.google.com/
2. Real-time → Overview
3. Should see active users

### **Microsoft Clarity:**
1. Go to https://clarity.microsoft.com/
2. Dashboard → Sessions
3. Should see recordings (5-10 min delay)

### **Mixpanel:**
1. Go to https://mixpanel.com/
2. Events → Live View
3. Should see events in real-time

### **Sentry:**
1. Go to https://sentry.io/
2. Issues → Dashboard
3. Test with error button in app

---

## 🐛 Troubleshooting

### **"Supabase client has no URL"**
- Check `VITE_SUPABASE_URL` in `.env.local`
- Restart dev server after changing `.env.local`

### **"Analytics not loading"**
- Check tokens in `/index.html`
- Disable ad blockers
- Check browser console for errors
- Verify network requests in DevTools

### **"Database connection failed"**
- Verify Supabase project is active
- Check RLS policies are set
- Run migrations: `supabase db push`

### **"Build fails"**
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear build cache: `rm -rf dist .vite`
- Check TypeScript errors: `npm run type-check`

---

## 📚 Next Steps

After setup:

1. **Test all features** - Sign up, create tasks, track energy
2. **Check analytics** - Verify events in all platforms
3. **Review documentation** - Read `/ANALYTICS_COMPLETE.md`
4. **Customize** - Update branding, colors, copy
5. **Deploy** - Push to production hosting

---

## 🆘 Need Help?

- **Documentation:** Check `/docs` folder
- **Issues:** Open GitHub issue
- **Analytics Guide:** `/ANALYTICS_COMPLETE.md`
- **Architecture:** `/KAAL_ARCHITECTURE.md`

---

## ✅ Setup Complete Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` created and filled
- [ ] Supabase project created
- [ ] Database migrations run
- [ ] `index.html` updated with tokens
- [ ] `sentry-config.ts` updated
- [ ] Dev server runs (`npm run dev`)
- [ ] Sign up/sign in works
- [ ] Tasks can be created
- [ ] Analytics tracking verified
- [ ] Production build successful (`npm run build`)
- [ ] Deployed to hosting platform
- [ ] Environment variables set in hosting
- [ ] Production site tested

---

**Congratulations! Your KAAL instance is ready! 🎉**

For ongoing maintenance, see monitoring guides in `/docs`.
