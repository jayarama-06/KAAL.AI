#!/bin/bash

# KAAL Secret Detection Script
# Run this before git push to check for hardcoded secrets

echo "🔍 Checking for hardcoded secrets in KAAL codebase..."
echo ""

FOUND_SECRETS=0

# Check for Google Analytics IDs (format: G-XXXXXXXXXX)
echo "Checking for Google Analytics IDs..."
if git grep -n "G-[A-Z0-9]\{10\}" -- '*.html' '*.ts' '*.tsx' '*.js' '*.jsx' 2>/dev/null | grep -v "YOUR_GA4" | grep -v "example"; then
    echo "❌ Found Google Analytics ID!"
    FOUND_SECRETS=1
else
    echo "✅ No Google Analytics IDs found"
fi
echo ""

# Check for Mixpanel tokens (32 char hex)
echo "Checking for Mixpanel tokens..."
if git grep -n "[a-f0-9]\{32\}" -- '*.html' '*.ts' '*.tsx' '*.js' '*.jsx' 2>/dev/null | grep -v "YOUR_MIXPANEL" | grep -v "example"; then
    echo "❌ Found Mixpanel token!"
    FOUND_SECRETS=1
else
    echo "✅ No Mixpanel tokens found"
fi
echo ""

# Check for Sentry DSN
echo "Checking for Sentry DSN..."
if git grep -n "https://.*@.*\.sentry\.io" -- '*.ts' '*.tsx' '*.js' '*.jsx' 2>/dev/null | grep -v "YOUR_SENTRY" | grep -v "example"; then
    echo "❌ Found Sentry DSN!"
    FOUND_SECRETS=1
else
    echo "✅ No Sentry DSN found"
fi
echo ""

# Check for Supabase URLs
echo "Checking for Supabase URLs..."
if git grep -n "https://.*\.supabase\.co" -- '*.ts' '*.tsx' '*.js' '*.jsx' 2>/dev/null | grep -v "YOUR_SUPABASE" | grep -v "example" | grep -v "supabase.com"; then
    echo "❌ Found Supabase URL!"
    FOUND_SECRETS=1
else
    echo "✅ No Supabase URLs found"
fi
echo ""

# Check for generic API keys
echo "Checking for API key patterns..."
if git grep -n -E "(sk_|pk_|api_key|apikey)" -- '*.ts' '*.tsx' '*.js' '*.jsx' 2>/dev/null | grep -v "YOUR_" | grep -v "example" | grep -v "// " | grep -v "const " | grep -v "let "; then
    echo "⚠️  Found potential API key references (review manually)"
else
    echo "✅ No obvious API keys found"
fi
echo ""

# Check if .env.local exists and is gitignored
echo "Checking .env.local status..."
if [ -f ".env.local" ]; then
    if git check-ignore .env.local > /dev/null 2>&1; then
        echo "✅ .env.local exists and is gitignored"
    else
        echo "❌ .env.local exists but is NOT gitignored!"
        FOUND_SECRETS=1
    fi
else
    echo "⚠️  .env.local not found (might not be created yet)"
fi
echo ""

# Check if sensitive docs are gitignored
echo "Checking sensitive documentation..."
SENSITIVE_DOCS=(
    "TRIPLE_ANALYTICS_COMPLETE.md"
    "QUADRUPLE_ANALYTICS_COMPLETE.md"
    "MIXPANEL_STATUS.md"
    "MIXPANEL_INTEGRATION_GUIDE.md"
)

for doc in "${SENSITIVE_DOCS[@]}"; do
    if [ -f "$doc" ]; then
        if git check-ignore "$doc" > /dev/null 2>&1; then
            echo "✅ $doc is gitignored"
        else
            echo "❌ $doc should be gitignored!"
            FOUND_SECRETS=1
        fi
    fi
done
echo ""

# Summary
echo "=================================="
if [ $FOUND_SECRETS -eq 0 ]; then
    echo "✅ SUCCESS: No secrets detected!"
    echo "✅ Safe to push to git"
    exit 0
else
    echo "❌ FAILED: Potential secrets detected!"
    echo "❌ DO NOT push until fixed"
    echo ""
    echo "Actions to take:"
    echo "1. Replace hardcoded secrets with placeholders"
    echo "2. Move secrets to .env.local"
    echo "3. Add sensitive files to .gitignore"
    echo "4. Run this script again"
    exit 1
fi
