# 🚀 Git Push Guide

Quick reference for pushing KAAL to GitHub.

---

## 📋 Pre-Push Checklist

### ✅ Code Quality
- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] No lint errors: `npm run lint` (if configured)
- [ ] Tests pass: `npm test`

### ✅ Files
- [ ] `.env` is in `.gitignore` (DO NOT commit secrets!)
- [ ] `node_modules/` is in `.gitignore`
- [ ] Removed all redundant documentation files ✅ (Done!)
- [ ] README is comprehensive ✅ (Done!)

### ✅ Cleanup
- [ ] Deleted debug/test components ✅ (Done!)
- [ ] Removed console.log statements (optional)
- [ ] No commented-out code blocks

---

## 🎯 First-Time Setup

### 1. Initialize Git (if not already done)

```bash
git init
```

### 2. Add Remote Repository

**Option A: Create new repository on GitHub**
1. Go to [github.com/new](https://github.com/new)
2. Name: `KAAL` (or your preferred name)
3. Description: "Executive Function AI Assistant for ADHD"
4. Choose: Public or Private
5. **DO NOT** initialize with README (you already have one!)
6. Click "Create repository"

**Option B: Use existing repository**
```bash
git remote add origin https://github.com/aama47735-source/KAAL.git
```

### 3. Verify Remote

```bash
git remote -v
# Should show:
# origin  https://github.com/aama47735-source/KAAL.git (fetch)
# origin  https://github.com/aama47735-source/KAAL.git (push)
```

---

## 📤 Pushing Code

### Step 1: Check Status

```bash
git status
```

This shows:
- Modified files (red)
- New files (red)
- Staged files (green)

### Step 2: Stage Files

**Stage all files:**
```bash
git add .
```

**Stage specific files:**
```bash
git add README.md DEPLOYMENT.md CONTRIBUTING.md
```

**Stage by pattern:**
```bash
git add "*.tsx"  # All TypeScript components
git add "lib/*"  # All library files
```

### Step 3: Commit Changes

```bash
git commit -m "feat: initial release v1.0.0 - hackathon submission"
```

**Better commit message:**
```bash
git commit -m "feat: complete KAAL v1.0.0 for SAI University Hackathon

- Add proactive AI intelligence layer with task ranking
- Implement Gemini-powered nudge system
- Create 19-table database schema
- Build 19 screens with glass morphism design
- Add comprehensive documentation
- Remove redundant files and clean codebase"
```

### Step 4: Push to GitHub

**First push (set upstream):**
```bash
git branch -M main  # Rename branch to 'main'
git push -u origin main
```

**Subsequent pushes:**
```bash
git push
```

---

## 🔄 Common Workflows

### Update Existing Repository

```bash
# 1. Check current status
git status

# 2. Stage all changes
git add .

# 3. Commit with message
git commit -m "docs: update README with deployment instructions"

# 4. Push
git push
```

### Push Specific Feature

```bash
# Create feature branch
git checkout -b feature/nudge-improvements

# Make changes...

# Stage and commit
git add lib/nudgeEngine.ts
git commit -m "feat(nudges): improve escalation logic"

# Push feature branch
git push -u origin feature/nudge-improvements

# Then create Pull Request on GitHub
```

### Fix Mistakes

**Undo last commit (keep changes):**
```bash
git reset --soft HEAD~1
```

**Undo last commit (discard changes):**
```bash
git reset --hard HEAD~1
```

**Amend last commit:**
```bash
git commit --amend -m "New commit message"
git push --force  # Only if you've already pushed!
```

---

## 🚨 Troubleshooting

### Error: "Repository not found"

**Solution**: Check remote URL
```bash
git remote -v
git remote set-url origin https://github.com/YOUR_USERNAME/KAAL.git
```

### Error: "Permission denied (publickey)"

**Solution**: Set up SSH or use HTTPS
```bash
# Switch to HTTPS
git remote set-url origin https://github.com/aama47735-source/KAAL.git
```

### Error: "Updates were rejected"

**Solution**: Pull first, then push
```bash
git pull origin main --rebase
git push
```

### Error: ".env committed by mistake"

**Solution**: Remove from history
```bash
# Remove file from Git
git rm --cached .env

# Add to .gitignore
echo ".env" >> .gitignore

# Commit
git commit -m "chore: remove .env from tracking"
git push
```

**⚠️ IMPORTANT**: If you already pushed `.env`, you must:
1. Rotate all secrets (Supabase keys, Gemini API key)
2. Use `git filter-branch` or BFG Repo-Cleaner to remove from history
3. Force push (only if repo is private!)

---

## 🔐 Security Best Practices

### ✅ DO:
- Add `.env` to `.gitignore` before first commit
- Use environment variables for secrets
- Keep `.gitignore` up to date
- Review files before `git add .`
- Use `git diff` to check changes

### ❌ DON'T:
- Commit API keys or passwords
- Push `node_modules/`
- Push build artifacts (`/dist`)
- Force push to main branch (unless you're sure)
- Commit sensitive user data

---

## 📊 Useful Git Commands

### View History
```bash
git log --oneline  # Compact history
git log --graph --oneline --all  # Visual branch history
```

### View Changes
```bash
git diff  # Unstaged changes
git diff --staged  # Staged changes
git diff main..feature-branch  # Compare branches
```

### Branch Management
```bash
git branch  # List branches
git checkout -b new-branch  # Create and switch
git branch -d old-branch  # Delete branch
```

### Undo Changes
```bash
git checkout -- file.txt  # Discard changes to file
git clean -fd  # Remove untracked files
git stash  # Temporarily save changes
git stash pop  # Restore stashed changes
```

---

## 🎯 Hackathon Submission Workflow

### Final Push Before Deadline

```bash
# 1. Ensure everything builds
npm run build

# 2. Check status
git status

# 3. Stage all final changes
git add .

# 4. Final commit
git commit -m "feat: KAAL v1.0.0 - SAI University FOSS Club Hackathon 2026

Complete executive function AI assistant with:
- Proactive AI nudge system powered by Google Gemini
- Client-side task ranking algorithm
- 19-table database with Row Level Security
- 19 screens with glass morphism design
- Real-time Supabase integration
- Comprehensive documentation

Team: JAIRAM
Developer: Akulapalli Jayaram
Submission: February 23, 2026"

# 5. Push to GitHub
git push

# 6. Verify on GitHub
# Go to https://github.com/aama47735-source/KAAL
# Check all files are present

# 7. Create release tag
git tag -a v1.0.0 -m "KAAL v1.0.0 - Hackathon Submission"
git push origin v1.0.0
```

---

## 🌟 After Push

### Create GitHub Release

1. Go to `https://github.com/aama47735-source/KAAL/releases`
2. Click **"Create a new release"**
3. Tag: `v1.0.0`
4. Title: **KAAL v1.0.0 - SAI University Hackathon 2026**
5. Description:
```markdown
# KAAL - Executive Function AI Assistant

**First production release for SAI University FOSS Club Hackathon 2026**

## ✨ Key Features
- 🧠 Proactive AI Intelligence Layer
- ✅ Smart Task Ranking ("KAAL Pick")
- 🔔 Context-Aware Nudge Notifications
- 📊 Advanced Analytics & Insights
- ⚡ Energy & Cognitive Mode Tracking
- 🎨 Beautiful Glass Morphism UI

## 🏗️ Technical Highlights
- React 18 + TypeScript
- Supabase (19 tables, 259+ columns)
- Google Gemini AI integration
- Tailwind CSS v4
- Real-time sync
- WCAG 2.1 AA accessible

## 📦 Assets
- Production build ready for deployment
- Comprehensive documentation
- Database migration scripts
- Edge Functions for AI

## 🎯 Hackathon Details
- **Team**: JAIRAM
- **Developer**: Akulapalli Jayaram
- **Event**: SAI University FOSS Club Hackathon
- **Date**: February 23, 2026

Built with ❤️ for the ADHD community
```
6. Click **"Publish release"**

### Share Your Work

```bash
# Your repository URL
https://github.com/aama47735-source/KAAL

# Live demo (after deployment)
https://kaal-app.vercel.app  # (or your domain)
```

---

## 🎉 Success!

Your code is now on GitHub! 🚀

**Next steps:**
1. ✅ Share repository link with hackathon organizers
2. ✅ Deploy to Vercel/Netlify (see [DEPLOYMENT.md](DEPLOYMENT.md))
3. ✅ Create demo video (optional)
4. ✅ Add GitHub badges to README
5. ✅ Invite collaborators

---

<div align="center">

**Good luck with your hackathon submission! 🏆**

</div>
