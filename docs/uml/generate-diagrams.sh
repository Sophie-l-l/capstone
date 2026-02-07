#!/bin/bash

echo "🎨 Generating PNG diagrams from PlantUML markdown files..."
echo ""

# Create .puml files from markdown
for md in *.md; do
    name="${md%.md}"
    echo "📄 Extracting: $md -> ${name}.puml"
    sed -n '/```plantuml/,/```/p' "$md" | sed '1d;$d' > "${name}.puml"
done

echo ""
echo "🖼️  Generating PNG images..."

# Generate PNGs
plantuml -tpng *.puml

echo ""
echo "✅ Generated diagrams:"
ls -lh *.png | awk '{print "   " $9 " (" $5 ")"}'

echo ""
echo "📊 Total: $(ls *.png 2>/dev/null | wc -l | tr -d ' ') PNG files created"
