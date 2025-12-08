#!/bin/bash
# Script to set Vercel environment variables for production

echo "🚀 Setting Vercel Environment Variables..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Install with: npm install -g vercel"
    exit 1
fi

# Navigate to frontend directory
cd "$(dirname "$0")/../apps/frontend" || exit 1

# Set environment variables
echo "📝 Setting NEXT_PUBLIC_API_URL..."
vercel env add NEXT_PUBLIC_API_URL production <<EOF
https://educode-backend-162585155042.us-central1.run.app
EOF

echo "📝 Setting NEXT_PUBLIC_USE_MOCK_DATA..."
vercel env add NEXT_PUBLIC_USE_MOCK_DATA production <<EOF
false
EOF

echo "📝 Setting NEXT_PUBLIC_USE_MOCK_AUTH..."
vercel env add NEXT_PUBLIC_USE_MOCK_AUTH production <<EOF
false
EOF

echo "📝 Setting NEXT_PUBLIC_USE_MOCK_PROBLEMS..."
vercel env add NEXT_PUBLIC_USE_MOCK_PROBLEMS production <<EOF
false
EOF

echo "📝 Setting NEXT_PUBLIC_USE_MOCK_ANALYTICS..."
vercel env add NEXT_PUBLIC_USE_MOCK_ANALYTICS production <<EOF
false
EOF

echo "✅ Environment variables set!"
echo ""
echo "📌 Next steps:"
echo "1. Verify variables: vercel env ls"
echo "2. Trigger redeploy: git commit --allow-empty -m 'Trigger redeploy' && git push"
echo "   OR use Vercel dashboard to redeploy"
echo ""
echo "🌐 After redeployment, your frontend will connect to:"
echo "   Backend: https://educode-backend-162585155042.us-central1.run.app"
