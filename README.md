# EduCode Adaptive Coding Platform

## Overview
EduCode is an adaptive learning platform for programming education, designed to track student mastery of core coding skills (Knowledge Components, KCs) using Bayesian Knowledge Tracing (BKT) and provide personalized feedback and recommendations. The platform integrates a modern frontend, a robust backend API, an AI microservice for analytics, and a secure code execution engine (Judge0).

## Features
- **User Authentication & Consent Management**
- **Problem Solving with Code Submission (Judge0 Integration)**
- **Knowledge Component (KC) Tagging for Problems**
- **Bayesian Knowledge Tracing (BKT) for Skill Mastery**
- **Instructor Dashboard & Student Progress Analytics**
- **Basic Emotion/Face Data Pipeline (OpenFace Prep)**
- **Personalized Recommendations for Weak Skills**

## Architecture
```
educode-adaptive-platform/
├── apps/
│   ├── frontend/      # Next.js (React) UI
│   ├── backend/       # Node.js + Express + Prisma API
│   └── ai-service/    # Python FastAPI microservice (BKT, analytics)
├── packages/
│   └── shared-types/  # TypeScript interfaces for FE/BE sync
└── README.md
```

- **Frontend**: Next.js, shadcn/ui, Tailwind CSS
- **Backend**: Node.js, Express, Prisma, PostgreSQL
- **AI Service**: Python, FastAPI (BKT, OpenFace stub)
- **Compiler**: Judge0 (cloud API)

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.8+
- PostgreSQL 15+
- npm (with workspaces support)

### Setup
1. **Clone the repo**
   ```bash
   git clone https://github.com/Sophie-l-l/capstone.git
   cd capstone/educode-adaptive-platform
   ```

2. **Install dependencies**
   ```bash
   npm install --workspaces
   ```

3. **Start PostgreSQL and set up database**
   ```bash
   brew install postgresql@15
   brew services start postgresql@15
   # Create DB and user as per .env.example
   ```

4. **Run Prisma migrations**
   ```bash
   cd apps/backend
   npx prisma migrate dev --name init
   ```

5. **Start all services**
   ```bash
   npm run dev
   # Frontend: http://localhost:3000
   # Backend: http://localhost:3001
   # AI-service: http://localhost:8000
   ```

## Testing & Verification
- Register and log in as a user
- Accept consent dialog (stored in DB)
- Solve a problem (tagged with KC)
- Submit code (Judge0 runs, backend updates BKT)
- Dashboard shows KC mastery and recommendations
- Instructor/admin can tag problems with KCs
- AI-service `/bkt/update` endpoint updates pKnown
- Face data endpoint `/analyze-face` accepts image (stub)

See `TESTING.md` for detailed test logs and screenshots.

## Project Phases & Milestones

| Phase | Key Deliverables | Status |
|-------|------------------|--------|
| Phase 1 | DB schema, consent, KC tagging, BKT, OpenFace prep | ✅ Complete |
| Phase 2 | Automated feedback, instructor dashboard, profiles | 🔄 In progress |
| Phase 3 | Analytics, adaptive hinting, recommendations | 📋 Planned |
| Phase 4 | Emotion/face data integration, privacy controls | 📋 Planned |

## Documentation
- `TESTING.md`: Core platform test checklist and evidence
- `docs/screenshots/`: UI and DB verification images
- `API_SPEC.md`: REST API endpoints and contracts
- `DEVELOPMENT_LOG.md`: Complete development history and progress

## Contributing
Pull requests and issues are welcome! Please open an issue to discuss major changes.

## License
MIT License

## Contact
- **Project Lead**: Sophie L
- **Repository**: https://github.com/Sophie-l-l/capstone
- **Project**: Capstone - Adaptive Learning Platform
