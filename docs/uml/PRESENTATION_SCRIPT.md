# UML Diagrams - 1 Minute Script

**Total Time: ~5 minutes (1 minute per diagram)**

---

## 1. CLASS DIAGRAM (~1 minute)

> "This class diagram shows our database schema and relationships. At the center, we have the **User** model which can be either a student or instructor. 
>
> Students create **Submissions** for **Problems**, which have **Test Cases**. Each submission can have a **SubmissionError** linked to an **ErrorSignature** - this is where our AI classification lives with IEEE 1044 and Zehetmeier cognitive causes.
>
> The **BKTState** model tracks student mastery using Bayesian Knowledge Tracing - each student has a probability score for each **KnowledgeComponent**.
>
> Instructors manage **Classes**, which have **Enrollments** and **ProblemSets** containing multiple problems. This creates the complete learning management flow."

**Key Points to Show:**
- User → Submission → Problem relationship
- SubmissionError → ErrorSignature (AI classification)
- BKTState tracks mastery per knowledge component
- Class → Enrollment → ProblemSet structure

---

## 2. DEPLOYMENT DIAGRAM (~1 minute)

> "Our deployment architecture runs entirely on Google Cloud Platform for production.
>
> The **frontend** is hosted on Vercel for fast global CDN delivery. It's a Next.js app that students and instructors access via browsers.
>
> The **backend** runs on Cloud Run - serverless containers that auto-scale. It handles authentication, code execution via Judge0 API, and coordinates with our AI service.
>
> The **AI service** also runs on Cloud Run, using GPT-4 to classify errors into academic frameworks. It returns cognitive causes and Bloom's taxonomy levels.
>
> All data is stored in **Cloud SQL** with PostgreSQL - our production database with automated backups.
>
> For code execution, we use the external **Judge0 API** which safely runs student code in isolated sandboxes and returns results."

**Key Points to Show:**
- Vercel (Frontend) → Cloud Run (Backend) → Cloud SQL (Database)
- Backend → Judge0 API (code execution)
- Backend → AI Service (error classification)
- All connected via HTTPS/REST

---

## 3. PACKAGE DIAGRAM (~1 minute)

> "This package diagram shows how our code is organized across the monorepo.
>
> The **Frontend** has three main packages: the app with pages like dashboard, problems, and metrics; components like code-editor and charts; and lib utilities for API calls.
>
> The **Backend** is organized by routes - auth, problems, code execution, submissions. We have services for BKT updates, Judge0 integration, and AI classification. The Prisma package handles all database operations with migrations.
>
> The **AI Service** is a Python FastAPI app with the LLM client for GPT-4 and error classification logic.
>
> We also have **Shared Types** - a TypeScript package that both frontend and backend import to ensure type consistency across the platform.
>
> All packages communicate through clean REST APIs."

**Key Points to Show:**
- Frontend: app → components → lib
- Backend: routes → services → prisma
- AI Service: Python with LLM client
- Shared Types package for consistency

---

## 4. SEQUENCE DIAGRAM - SUBMISSION FLOW (~1 minute)

> "This sequence diagram shows exactly what happens when a student submits code.
>
> First, the **student clicks Submit** in the browser. The frontend sends the code to our backend API.
>
> The backend forwards it to **Judge0** for compilation and execution against test cases. Judge0 runs the code in a secure sandbox and returns results - either success or error messages.
>
> If there's an error, the backend calls our **AI Service** with the error text and student's code. The AI uses GPT-4 to classify it into surface errors, cognitive causes, and Bloom levels.
>
> The backend then **updates the BKT model** - if the student got it right, their mastery probability increases. If wrong, it decreases based on Bayesian inference.
>
> Finally, everything is saved to the **database** - the submission, error classification, and updated mastery scores - and the results are sent back to the frontend where the student sees immediate feedback with AI-powered insights."

**Key Points to Show:**
- Student → Frontend → Backend → Judge0
- Backend → AI Service (if error occurs)
- Backend updates BKT states
- Backend → Database (save everything)
- Response flows back to student

---

## 5. USE CASE DIAGRAM (~1 minute)

> "This use case diagram shows what different users can do in the system.
>
> **Students** can solve problems with our code editor, view their submissions and get AI-powered error feedback, track their progress with BKT mastery scores, and see personalized problem recommendations.
>
> **Instructors** can create and manage problems with test cases, organize classes and enroll students, create assignments by bundling problems into sets, and view detailed analytics - who's struggling, which concepts need more practice, and error pattern analysis.
>
> The **system** itself handles code execution through Judge0, runs AI classification to identify error types and cognitive causes, updates BKT mastery models in real-time, and generates analytics and recommendations.
>
> There's also a **guest** actor who can view public problems and the platform demo, but can't submit code until they register."

**Key Points to Show:**
- Student use cases: Solve, Submit, View Progress
- Instructor use cases: Create, Manage, Analyze
- System automated processes: Execute, Classify, Track Mastery
- Clear separation of concerns

---

## DELIVERY TIPS

**For Each Diagram:**
1. **Start with context** (10 sec): "This shows..."
2. **Walk through main flow** (30 sec): Point to key elements
3. **Highlight innovation** (15 sec): BKT, AI classification, etc.
4. **End with impact** (5 sec): "This enables..."

**Visual Aids:**
- Point to arrows showing data flow
- Highlight key relationships with cursor
- Use color coding if present

**Practice:**
- Time yourself on each diagram
- Focus on the "so what?" - why it matters
- Anticipate questions (have 15-sec answers ready)

---

**TOTAL TIME: 5 minutes for all 5 diagrams = Perfect for demo!**
