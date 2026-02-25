# 🚀 Quick Reference - Git Push Checklist

**Run this checklist before every git push to ensure security**

---

## ⚡ Quick Commands

### **Check for Secrets (Automated)**
```bash
chmod +x scripts/check-secrets.sh
./scripts/check-secrets.sh
```

### **Manual Secret Check**
```bash
# Check for Google Analytics IDs
git grep "G-[A-Z0-9]\{10\}" -- '*.html' '*.ts' '*.tsx'

# Check for Mixpanel tokens
git grep "[a-f0-9]\{32\}" -- '*.html' '*.ts' '*.tsx'

# Check for Sentry DSN
git grep "https://.*@.*sentry.io" -- '*.ts' '*.tsx'
```

### **Verify Gitignore**
```bash
# Check .env.local is ignored
git check-ignore .env.local

# Check sensitive docs are ignored
git status | grep "ANALYTICS_COMPLETE"
```

### **Review Changes**
```bash
# See what will be committed
git status

# Review all changes
git diff

# Review staged changes
git diff --staged
```

---

## ✅ 5-Second Checklist

Run before **EVERY** push:

1. **[ ] Secrets Cleaned**
   ```bash
   ./scripts/check-secrets.sh
   ```

2. **[ ] Build Works**
   ```bash
   npm run build
   ```

3. **[ ] Changes Reviewed**
   ```bash
   git diff
   ```

4. **[ ] Nothing Sensitive Staged**
   ```bash
   git status | grep -E "(.env.local|ANALYTICS_COMPLETE)"
   ```

5. **[ ] Gitignore Updated**
   ```bash
   cat .gitignore | grep ".env.local"
   ```

✅ **All clear? Push away!**

---

## 🔥 Quick Fixes

### **If .env.local is Tracked**
```bash
git rm --cached .env.local
echo ".env.local" >> .gitignore
git add .gitignore
git commit -m "chore: gitignore .env.local"
```

### **If Sensitive Doc is Tracked**
```bash
git rm --cached MIXPANEL_STATUS.md
echo "MIXPANEL_STATUS.md" >> .gitignore
git add .gitignore
git commit -m "chore: gitignore sensitive docs"
```

### **If Secret in index.html**
```bash
# Replace token with placeholder
sed -i 's/67f26b4aa269831d610b60a4683172ff/YOUR_MIXPANEL_TOKEN/g' index.html
git add index.html
git commit -m "chore: sanitize analytics tokens"
```

### **If Already Pushed Secret**
```bash
# Rotate ALL secrets immediately
# Then clean git history:
git filter-repo --invert-paths --path .env.local
git push --force
```

---

## 📊 File Status Quick Check

### **Safe to Commit (Public):**
✅ `README_PUBLIC.md`
✅ `ANALYTICS_COMPLETE.md`
✅ `MIXPANEL_INTEGRATION_GUIDE_PUBLIC.md`
✅ `SETUP_GUIDE.md`
✅ `.env.example`
✅ `.gitignore`
✅ `index.html.template`

### **Never Commit (Private):**
❌ `.env.local`
❌ `TRIPLE_ANALYTICS_COMPLETE.md`
❌ `QUADRUPLE_ANALYTICS_COMPLETE.md`
❌ `MIXPANEL_STATUS.md`
❌ `MIXPANEL_INTEGRATION_GUIDE.md`
❌ Any file with actual API keys

### **Sanitize First:**
⚠️ `index.html` (replace tokens)
⚠️ `services/sentry-config.ts` (use env vars)

---

## 🎯 One-Line Checks

```bash
# All-in-one security check
./scripts/check-secrets.sh && npm run build && git diff && echo "✅ Ready to push!"

# Quick grep check
git grep -E "(G-[A-Z0-9]{10}|[a-f0-9]{32})" -- '*.html' '*.ts' '*.tsx' && echo "❌ Found secrets!" || echo "✅ No secrets!"

# Environment check
[ -f .env.local ] && git check-ignore .env.local && echo "✅ .env.local safe" || echo "❌ .env.local issue!"

# Gitignore check
git status | grep -E "(.env.local|ANALYTICS_COMPLETE)" && echo "❌ Sensitive files staged!" || echo "✅ No sensitive files!"
```

---

## 💡 Best Practices

1. **Always run `./scripts/check-secrets.sh` before push**
2. **Review `git diff` every time**
3. **Use `.env.local` for ALL secrets**
4. **Never commit with `-f` or `--no-verify` unless you know why**
5. **When in doubt, ask for review**

---

## 🆘 Emergency Contacts

- **Accidentally pushed secret?** → Rotate it IMMEDIATELY
- **Need to clean git history?** → Use `git-filter-repo`
- **Unsure if safe?** → Run `./scripts/check-secrets.sh`

---

## ✅ Safe Push Command

When all checks pass:

```bash
git add .
git commit -m "your commit message"
git push origin main
```

---

**Print this checklist and keep it handy! 📋**

**Last Updated:** February 25, 2026
