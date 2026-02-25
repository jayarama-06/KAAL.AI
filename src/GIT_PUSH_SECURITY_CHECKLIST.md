# 🔒 Pre-Git Push Security Checklist

**IMPORTANT:** Run through this checklist before pushing to ensure no sensitive data is exposed.

---

## ✅ Environment Variables

- [ ] `.env.local` file is **NOT** tracked in git
- [ ] `.env.local` is listed in `.gitignore`
- [ ] No API keys in `.env` (only use `.env.local`)
- [ ] `.env.example` created with placeholder values
- [ ] All sensitive values use placeholder format: `your-key-here`

**Check:**
```bash
# Should return empty (no .env.local in git)
git status | grep .env.local

# Should return the file (is ignored)
git check-ignore .env.local
```

---

## ✅ Configuration Files

### **`/index.html`**
- [ ] Google Analytics ID replaced with `YOUR_GA4_MEASUREMENT_ID`
- [ ] Clarity ID replaced with `YOUR_CLARITY_PROJECT_ID`
- [ ] Mixpanel token replaced with `YOUR_MIXPANEL_TOKEN`
- [ ] OR use `index.html.template` and keep actual `index.html` local

**Check:**
```bash
# Search for actual tokens (should find none)
grep -r "G-[A-Z0-9]" index.html
grep -r "[a-z0-9]\{32\}" index.html
```

### **`/services/sentry-config.ts`**
- [ ] Sentry DSN replaced with placeholder
- [ ] Or DSN loaded from environment variable

---

## ✅ Documentation Files

### **Sanitized (Safe to Commit):**
- [ ] `/README_PUBLIC.md` - Public readme
- [ ] `/ANALYTICS_COMPLETE.md` - Generic analytics guide
- [ ] `/MIXPANEL_INTEGRATION_GUIDE_PUBLIC.md` - Public Mixpanel guide
- [ ] `/SETUP_GUIDE.md` - Setup instructions
- [ ] `/.env.example` - Template with placeholders

### **With Sensitive Data (Should be Gitignored):**
- [ ] `/TRIPLE_ANALYTICS_COMPLETE.md` - Has actual IDs
- [ ] `/QUADRUPLE_ANALYTICS_COMPLETE.md` - Has actual IDs
- [ ] `/MIXPANEL_STATUS.md` - Has actual token
- [ ] `/MIXPANEL_INTEGRATION_GUIDE.md` - Has actual token
- [ ] `/GOOGLE_ANALYTICS_GUIDE.md` - Has actual ID
- [ ] `/CLARITY_INTEGRATION_GUIDE.md` - Has actual ID
- [ ] `/SENTRY_INTEGRATION_GUIDE.md` - Has actual DSN
- [ ] `/ANALYTICS_MONITORING_SETUP.md` - Has actual values

**Check `.gitignore`:**
```bash
# These should be listed in .gitignore
cat .gitignore | grep "ANALYTICS_COMPLETE"
```

---

## ✅ Code Files

### **Search for Hardcoded Secrets:**

```bash
# Google Analytics ID (format: G-XXXXXXXXXX)
git grep -n "G-[A-Z0-9]" -- '*.ts' '*.tsx' '*.js' '*.jsx'

# Mixpanel tokens (32 char hex)
git grep -n "[a-f0-9]\{32\}" -- '*.ts' '*.tsx'

# Sentry DSN
git grep -n "https://.*@.*sentry.io" -- '*.ts' '*.tsx'

# Supabase URLs
git grep -n "https://.*\.supabase\.co" -- '*.ts' '*.tsx'

# API keys
git grep -n "sk_" -- '*.ts' '*.tsx'
git grep -n "pk_" -- '*.ts' '*.tsx'
```

**All searches should return 0 results or only template files.**

---

## ✅ Git History

### **Check Git History for Secrets:**

```bash
# Check all files being committed
git status

# Review changes before commit
git diff

# Check for accidentally staged sensitive files
git diff --staged
```

### **If Secrets Were Committed:**

**Option 1: Before Push (Easy)**
```bash
# Remove from last commit
git reset --soft HEAD~1
# Fix files
# Recommit
```

**Option 2: After Push (Harder)**
```bash
# Use BFG Repo Cleaner
git clone --mirror git@github.com:user/repo.git
bfg --replace-text passwords.txt repo.git
cd repo.git
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push
```

---

## ✅ Final Checks

### **1. Review `.gitignore`**

```bash
cat .gitignore
```

Should include:
```
.env
.env.local
.env.*.local
TRIPLE_ANALYTICS_COMPLETE.md
QUADRUPLE_ANALYTICS_COMPLETE.md
MIXPANEL_STATUS.md
MIXPANEL_INTEGRATION_GUIDE.md
GOOGLE_ANALYTICS_GUIDE.md
CLARITY_INTEGRATION_GUIDE.md
SENTRY_INTEGRATION_GUIDE.md
```

### **2. Test Build**

```bash
npm run build
```

Should complete without errors.

### **3. Verify Environment Variables**

```bash
# Should show only example file
ls -la | grep .env

# Output should be:
# .env.example (safe to commit)
# .env.local (gitignored - NOT visible in git status)
```

### **4. Check What Will Be Committed**

```bash
# See what's staged
git status

# Review all changes
git diff

# Review staged changes
git diff --staged
```

---

## 🚀 Safe to Push When:

- [ ] All sensitive values replaced with placeholders
- [ ] `.env.local` is gitignored
- [ ] No hardcoded API keys in code
- [ ] Documentation with secrets is gitignored
- [ ] Public documentation created
- [ ] `.env.example` has placeholders
- [ ] `index.html` uses placeholders OR is gitignored
- [ ] Build succeeds
- [ ] Git diff reviewed
- [ ] No secrets in git history

---

## 📝 Recommended Commit Message

```bash
git add .
git commit -m "docs: add comprehensive analytics integration with sanitized config

- Add quadruple analytics stack (GA4, Clarity, Mixpanel, Sentry)
- Create public documentation without sensitive data
- Add .env.example with placeholder values
- Update .gitignore to exclude sensitive files
- Add setup guide for production deployment"
```

---

## 🔐 What to Keep Private

### **Never Commit:**
1. Actual API keys, tokens, or secrets
2. `.env.local` file
3. Supabase anon key (keep in env)
4. Google Analytics Measurement ID (in production)
5. Mixpanel project token (in production)
6. Sentry DSN
7. OAuth client secrets
8. Database passwords
9. Documentation with actual credentials

### **Safe to Commit:**
1. `.env.example` with placeholders
2. Public documentation (`*_PUBLIC.md`)
3. Code with environment variable references
4. `index.html.template` with placeholders
5. Generic setup guides
6. Architecture documentation

---

## ⚠️ If You Accidentally Committed Secrets

### **Immediate Actions:**

1. **Rotate ALL Secrets:**
   - Generate new Mixpanel token
   - Create new GA4 property
   - Regenerate Clarity project
   - Create new Sentry project
   - Update `.env.local` with new values

2. **Remove from Git History:**
```bash
# Use git-filter-repo (recommended)
pip install git-filter-repo
git filter-repo --invert-paths --path .env.local

# Or use BFG Repo Cleaner
bfg --delete-files .env.local
```

3. **Force Push:**
```bash
git push --force
```

4. **Update Documentation:**
   - Document the incident
   - Update credentials everywhere
   - Audit what was exposed

---

## ✅ Final Pre-Push Command

Run this before every push:

```bash
# Check for secrets
npm run check-secrets

# Or manually:
echo "Checking for hardcoded secrets..."
git grep -E "(G-[A-Z0-9]{10}|[a-f0-9]{32}|sk_|pk_)" -- '*.ts' '*.tsx' '*.js' '*.jsx' '*.html' && echo "❌ Found potential secrets!" || echo "✅ No secrets found"
```

---

## 📚 Additional Resources

- **Git Secrets Tool:** https://github.com/awslabs/git-secrets
- **BFG Repo Cleaner:** https://rtyley.github.io/bfg-repo-cleaner/
- **GitHub Secret Scanning:** https://docs.github.com/en/code-security/secret-scanning

---

## ✅ Checklist Summary

```
Environment Variables:
[ ] .env.local gitignored
[ ] .env.example created

Configuration Files:
[ ] index.html sanitized or gitignored
[ ] sentry-config.ts sanitized

Documentation:
[ ] Public versions created
[ ] Private versions gitignored

Code:
[ ] No hardcoded secrets
[ ] Environment variables used

Git:
[ ] .gitignore updated
[ ] Diff reviewed
[ ] Build succeeds
[ ] No secrets in history

Final:
[ ] All checks passed
[ ] Ready to push!
```

---

**When all boxes are checked, you're safe to push! 🚀**

```bash
git push origin main
```
