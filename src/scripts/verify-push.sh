#!/bin/bash

# KAAL Pre-Push Verification Script
# Run this to verify your repo is clean before pushing

echo "🔍 KAAL Pre-Push Verification"
echo "=============================="
echo ""

ERRORS=0

# 1. Check for sensitive data
echo "1️⃣  Checking for sensitive data..."
if ./scripts/check-secrets.sh > /dev/null 2>&1; then
    echo "    ✅ No secrets detected"
else
    echo "    ❌ Secrets detected! Run: ./scripts/check-secrets.sh"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 2. Check .env.local is gitignored
echo "2️⃣  Checking .env.local..."
if [ -f ".env.local" ]; then
    if git check-ignore .env.local > /dev/null 2>&1; then
        echo "    ✅ .env.local is gitignored"
    else
        echo "    ❌ .env.local is NOT gitignored!"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "    ⚠️  .env.local not found (might not be created yet)"
fi
echo ""

# 3. Check if index.html is sanitized or gitignored
echo "3️⃣  Checking index.html..."
if [ -f "index.html" ]; then
    if git check-ignore index.html > /dev/null 2>&1; then
        echo "    ✅ index.html is gitignored"
    elif grep -q "YOUR_GA4_MEASUREMENT_ID\|YOUR_CLARITY_PROJECT_ID\|YOUR_MIXPANEL_TOKEN" index.html; then
        echo "    ✅ index.html is sanitized (placeholders found)"
    else
        echo "    ❌ index.html contains actual tokens! Sanitize or gitignore it"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "    ⚠️  index.html not found"
fi
echo ""

# 4. Check build works
echo "4️⃣  Testing build..."
if npm run build > /dev/null 2>&1; then
    echo "    ✅ Build successful"
else
    echo "    ❌ Build failed! Run: npm run build"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 5. Check for uncommitted sensitive files
echo "5️⃣  Checking git status..."
if git status | grep -E "ANALYTICS_COMPLETE_STATUS|TRIPLE_ANALYTICS|QUADRUPLE_ANALYTICS|MIXPANEL_STATUS" > /dev/null 2>&1; then
    echo "    ❌ Sensitive docs are staged!"
    ERRORS=$((ERRORS + 1))
else
    echo "    ✅ No sensitive docs staged"
fi
echo ""

# 6. Count documentation files
echo "6️⃣  Documentation count..."
DOC_COUNT=$(find . -maxdepth 1 -name "*.md" | wc -l | tr -d ' ')
echo "    📄 $DOC_COUNT markdown files in root"
if [ "$DOC_COUNT" -gt 35 ]; then
    echo "    ⚠️  Many docs detected - consider cleanup"
else
    echo "    ✅ Documentation count looks good"
fi
echo ""

# Summary
echo "=============================="
if [ $ERRORS -eq 0 ]; then
    echo "✅ ALL CHECKS PASSED!"
    echo ""
    echo "You're ready to push! Run:"
    echo "  git add ."
    echo "  git commit -m 'your message'"
    echo "  git push origin main"
    exit 0
else
    echo "❌ $ERRORS ERROR(S) DETECTED"
    echo ""
    echo "Fix the errors above before pushing."
    echo "See /CLEAN_PUSH_READY.md for help."
    exit 1
fi
