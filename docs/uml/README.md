# UML Diagrams - EduCode Adaptive Platform

This directory contains UML diagrams for the EduCode platform architecture.

## 📊 Available Diagrams

1. **Class Diagram** (`class-diagram.md` / `.png`)
   - Database schema and model relationships
   - User, Problem, Submission, BKTState, etc.

2. **Deployment Diagram** (`deployment-diagram.md` / `.png`)
   - Cloud infrastructure on Google Cloud Platform
   - Frontend (Vercel), Backend (Cloud Run), Database (Cloud SQL)

3. **Package Diagram** (`package-diagram.md` / `.png`)
   - System component organization
   - Frontend packages, Backend routes, Services

4. **Sequence Diagram** (`sequence-diagram-submission.md` / `.png`)
   - Code submission workflow
   - Judge0 execution, BKT updates, Error classification

5. **Use Case Diagram** (`use-case-diagram.md` / `.png`)
   - User interactions and system features
   - Student and Instructor use cases

## 🛠️ Generating PNG Images

All diagrams are written in PlantUML format embedded in Markdown files.

### Quick Regeneration

```bash
./generate-diagrams.sh
```

### Manual Generation

```bash
# Extract PlantUML from markdown
for md in *.md; do
    name="${md%.md}"
    sed -n '/```plantuml/,/```/p' "$md" | sed '1d;$d' > "${name}.puml"
done

# Generate PNGs
plantuml -tpng *.puml
```

## 📦 Prerequisites

- **PlantUML**: Install via Homebrew
  ```bash
  brew install plantuml
  ```

- **Java**: Required by PlantUML (usually pre-installed on macOS)

## 📝 Editing Diagrams

1. Edit the `.md` file (not the `.puml` file directly)
2. Run `./generate-diagrams.sh` to regenerate PNGs
3. The `.puml` files are auto-generated from markdown

## 🖼️ Generated Files

- `*.md` - Source files with PlantUML code in markdown
- `*.puml` - Extracted PlantUML code (auto-generated)
- `*.png` - Rendered diagram images (auto-generated)

**Note**: Only commit `.md` files to git. The `.puml` and `.png` files can be regenerated.
