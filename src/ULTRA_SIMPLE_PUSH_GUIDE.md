# ⚡ PUSH TO GIT - ULTRA SIMPLE GUIDE

**Just want to push your code? Follow these 3 steps:**

---

## 🚀 Step 1: Sanitize index.html

Open `/index.html` and replace these 3 values:

```html
<!-- Line ~12 & ~16 -->
G-Q23JVQV845  →  YOUR_GA4_MEASUREMENT_ID

<!-- Line ~26 -->
vmha9lsejv  →  YOUR_CLARITY_PROJECT_ID

<!-- Line ~38 -->
67f26b4aa269831d610b60a4683172ff  →  YOUR_MIXPANEL_TOKEN
```

**OR** add to `.gitignore`:
```bash
echo "/index.html" >> .gitignore
```

---

## 🔍 Step 2: Run Verification

```bash
chmod +x scripts/verify-push.sh
./scripts/verify-push.sh
```

**If it says "ALL CHECKS PASSED" ✅ → Go to Step 3**  
**If it shows errors ❌ → Fix them first**

---

## 📤 Step 3: Push to Git

```bash
git add .

git commit -m "docs: add comprehensive documentation and clean up redundant files"

git push origin main
```

**Done! 🎉**

---

## ❓ Troubleshooting

### "Secrets detected!"
Run: `./scripts/check-secrets.sh` to see what needs fixing

### "Build failed!"
Run: `npm run build` to see the error

### ".env.local not gitignored!"
Run: `echo ".env.local" >> .gitignore`

### "Sensitive docs staged!"
Run: `git reset HEAD *.md` then check `.gitignore`

---

## 📋 What Gets Committed

**✅ YES:**
- Source code (components, services, lib)
- Public documentation (26 essential files)
- Configuration templates (.env.example, index.html.template)
- README, CONTRIBUTING, LICENSE

**❌ NO:**
- .env.local (your secrets)
- Analytics docs with actual tokens
- Redundant build fix docs
- Historical status files

---

## 🆘 Still Having Issues?

Check these docs:
1. `/CLEAN_PUSH_READY.md` - Complete guide
2. `/QUICK_PUSH_CHECKLIST.md` - Fast reference
3. `/GIT_PUSH_SECURITY_CHECKLIST.md` - Detailed security

---

**That's it! Three simple steps.** 🚀
