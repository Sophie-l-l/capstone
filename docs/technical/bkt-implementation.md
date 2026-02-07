# EduCode Platform - BKT Implementation Summary for Report

## 2.3 Bayesian Knowledge Tracing (BKT)

### Corrected Description
Bayesian Knowledge Tracing (BKT) is a state-of-the-art method in educational data mining for modeling student knowledge acquisition. BKT posits that for each Knowledge Component (KC), a student is either in a "known" or "unknown" state. The model calculates the probability of knowledge (pKnown) using four primary parameters: pInitial (initial knowledge), pLearn (learning rate), pGuess (probability of guessing correctly when unknown), and pSlip (probability of slipping up when known).

In EduCode, BKT is used to track mastery levels across **10 defined Knowledge Components** (e.g., 'arrays', 'recursion', 'trees', 'hash_maps'). By continuously updating the pKnown score after every submission, the platform dynamically identifies weak KCs and drives personalized recommendations, optimizing the student's learning path.

### Complete List of Knowledge Components (10 total)

1. **arrays** - Understanding and manipulating arrays
2. **hash_maps** - Using hash tables and dictionaries  
3. **two_pointers** - Two-pointer technique for optimization
4. **strings** - String manipulation and processing
5. **stacks** - Stack data structure and applications
6. **trees** - Tree data structures and algorithms
7. **dfs** - Depth-First Search algorithm
8. **recursion** - Recursive problem solving
9. **math** - Mathematical problem solving
10. **tree_traversal** - Tree traversal algorithms

### Implementation Details

**Location**: `apps/backend/src/services/bkt.service.ts`

**Default Parameters**:
```typescript
const DEFAULT_PARAMS = { 
  S: 0.05,  // Slip probability (knows but answers wrong)
  G: 0.2,   // Guess probability (doesn't know but answers right)
  T: 0.1    // Learn/transition probability
};
```

**Algorithm Flow**:
1. Student submits answer (correct/incorrect)
2. System retrieves current pKnown for relevant KC
3. Bayes' Theorem updates belief:
   - If **correct**: `P(know|correct) = [pKnown × (1-S)] / [pKnown × (1-S) + (1-pKnown) × G]`
   - If **incorrect**: `P(know|incorrect) = [pKnown × S] / [pKnown × S + (1-pKnown) × (1-G)]`
4. Apply learning: `pNew = posterior + (1 - posterior) × T`
5. Store updated pKnown in database
6. Display on dashboard as mastery percentage

**Example Update**:
- Student with 60% mastery (pKnown = 0.6) solves problem correctly
- Posterior after correct: ~0.88
- After learning: pKnown = 0.88 + (1 - 0.88) × 0.1 = 0.892 (~89%)

### Database Schema

**BKTState Table**:
```prisma
model BKTState {
  id          String   @id @default(uuid())
  userId      String
  kcId        String
  pKnown      Float    @default(0.2)  // Initial mastery: 20%
  attempts    Int      @default(0)
  corrects    Int      @default(0)
  lastUpdated DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id])
  kc   KnowledgeComponent @relation(fields: [kcId], references: [id])
  
  @@unique([userId, kcId])
}
```

### Integration Points

1. **Code Execution** (`apps/backend/src/routes/codeExecution.ts`):
   - After each submission, BKT updates for all KCs associated with the problem
   - Runs asynchronously to not block submission flow

2. **Student Dashboard** (`apps/backend/src/routes/studentDashboard.ts`):
   - Returns KC mastery array with pKnown values
   - Defaults to 0 for KCs without attempts

3. **Instructor Analytics** (`apps/backend/src/routes/instructorRoutes.ts`):
   - Aggregates pKnown across students for class-wide analytics
   - Identifies at-risk students (avgMastery < 0.4)

### Adaptive Recommendations

The system uses BKT data to:
- **Identify weak areas**: KCs with low pKnown (< 0.5)
- **Recommend targeted problems**: Filter by weak KC tags
- **Track progress**: Monitor pKnown changes over time
- **Personalize difficulty**: Adjust based on mastery levels

### Validation Data

**Test Student (test@example.com)**:
- Total Submissions: 208
- Accepted: 48 (23% acceptance rate)
- At-Risk Status: Yes (avgMastery < 40%)

All BKT data is tracked in production Cloud SQL database and displayed on:
- Student dashboard (`/dashboard`)
- Instructor analytics (`/dashboard/instructor`)
- Metrics page (`/metrics/student`)

---

## References

**Code Files**:
- BKT Algorithm: `apps/backend/src/services/bkt.service.ts`
- KC Seed Data: `apps/backend/prisma/seed.ts` (lines 295-306)
- Database Schema: `apps/backend/prisma/schema.prisma` (lines 196-209)
- Integration: `apps/backend/src/routes/codeExecution.ts` (lines 229-242)

**Production Deployment**:
- Backend: https://educode-backend-162585155042.us-central1.run.app
- Frontend: https://educode-adaptive-platform.vercel.app
- Database: Cloud SQL (PostgreSQL 15)
