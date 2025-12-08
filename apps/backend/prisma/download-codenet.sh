#!/bin/bash

# CodeNet Problem Metadata Downloader
# Downloads problem metadata from IBM Project CodeNet GitHub repository

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="$SCRIPT_DIR/codenet"
GITHUB_BASE="https://raw.githubusercontent.com/IBM/Project_CodeNet/main/metadata"

echo "=========================================="
echo "🚀 IBM CodeNet Metadata Downloader"
echo "=========================================="
echo ""

# Create data directory
mkdir -p "$DATA_DIR"
cd "$DATA_DIR"

echo "📂 Downloading to: $DATA_DIR"
echo ""

# Download problem list (main catalog)
echo "📥 Downloading problem list..."
if curl -f -L -o problem_list.csv "$GITHUB_BASE/problem_list.csv" 2>/dev/null; then
    TOTAL_PROBLEMS=$(tail -n +2 problem_list.csv | wc -l | tr -d ' ')
    echo "✅ Downloaded problem_list.csv ($TOTAL_PROBLEMS problems available)"
else
    echo "❌ Failed to download problem_list.csv"
    exit 1
fi

echo ""
echo "📊 Problem list contains: $TOTAL_PROBLEMS problems"
echo ""

# Ask user how many problems to download
echo "How many problems do you want to download?"
echo "  1) First 50 problems (fast - 2 minutes)"
echo "  2) First 200 problems (medium - 8 minutes)"
echo "  3) First 500 problems (slow - 20 minutes)"
echo "  4) All problems (very slow - 2-3 hours)"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
    1)
        COUNT=50
        ;;
    2)
        COUNT=200
        ;;
    3)
        COUNT=500
        ;;
    4)
        COUNT=$TOTAL_PROBLEMS
        ;;
    *)
        echo "Invalid choice. Using default: 50"
        COUNT=50
        ;;
esac

echo ""
echo "📥 Downloading metadata for $COUNT problems..."
echo ""

# Extract problem IDs from CSV (skip header)
PROBLEM_IDS=$(tail -n +2 problem_list.csv | head -n $COUNT | cut -d',' -f1)

SUCCESS=0
FAILED=0
SKIPPED=0

for problem_id in $PROBLEM_IDS; do
    # Remove quotes if present
    problem_id=$(echo $problem_id | tr -d '"')
    
    # Skip if already downloaded
    if [ -f "${problem_id}.csv" ]; then
        ((SKIPPED++))
        echo "⏭️  Skipped: $problem_id (already exists)"
        continue
    fi
    
    # Download problem metadata
    if curl -f -s -L -o "${problem_id}.csv" "$GITHUB_BASE/${problem_id}.csv" 2>/dev/null; then
        ((SUCCESS++))
        echo "✅ Downloaded: $problem_id ($SUCCESS/$COUNT)"
    else
        ((FAILED++))
        echo "⚠️  Failed: $problem_id (metadata not available)"
        # Remove failed download file
        rm -f "${problem_id}.csv"
    fi
    
    # Rate limiting - be nice to GitHub
    if [ $((SUCCESS % 10)) -eq 0 ] && [ $SUCCESS -gt 0 ]; then
        sleep 1
    fi
done

echo ""
echo "=========================================="
echo "✅ Download Complete!"
echo "=========================================="
echo "  Success: $SUCCESS problems"
echo "  Failed:  $FAILED problems"
echo "  Skipped: $SKIPPED problems"
echo "  Location: $DATA_DIR"
echo ""
echo "Next step: Run the import script"
echo "  npx ts-node import-codenet.ts"
echo "=========================================="
