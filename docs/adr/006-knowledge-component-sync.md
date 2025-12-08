# ADR 006: Automatic Knowledge Component Synchronization

## Status
Accepted

## Date
2024-12-09

## Context
The platform uses Knowledge Components (KCs) to track student mastery via Bayesian Knowledge Tracing (BKT). We discovered a critical issue:

**Problem**: Two separate storage locations for KCs with no synchronization
- `Problem.knowledgeComponents`: String array field on each problem
- `KnowledgeComponent` table: Separate table required for BKT tracking

**Impact**:
- When students solve problems, BKT tries to find KC by name in `KnowledgeComponent` table
- If KC doesn't exist in table, BKT fails or uses default pKnown (0.2 = 20%)
- Result: All students show 11-20% mastery regardless of actual progress
- Instructors cannot trust mastery metrics for intervention decisions

## Decision
We will implement **automatic bidirectional synchronization** between `Problem.knowledgeComponents` and `KnowledgeComponent` table:

### 1. Auto-Sync on Problem Creation
When an instructor creates a new problem:
```typescript
// In POST /api/problems endpoint
if (knowledgeComponents && Array.isArray(knowledgeComponents)) {
  for (const kcName of knowledgeComponents) {
    await prisma.knowledgeComponent.upsert({
      where: { name: kcName },
      update: {}, // No-op if exists
      create: {
        name: kcName,
        description: `Knowledge component: ${kcName}`
      }
    });
  }
}
// Then create problem with knowledgeComponents array
```

### 2. Migration for Existing Problems
One-time script to backfill KCs from all existing problems:
```typescript
// scripts/sync-knowledge-components.ts
const problems = await prisma.problem.findMany();
const uniqueKCs = new Set(problems.flatMap(p => p.knowledgeComponents));

for (const kcName of uniqueKCs) {
  await prisma.knowledgeComponent.upsert(...);
}
```

### 3. Idempotent Design
- Use `upsert()` instead of `create()` to handle duplicates safely
- Safe to run multiple times without errors
- Transaction safety via Prisma

## Alternatives Considered

### 1. Manual KC Entry by Instructors
- **Rejected**: Error-prone, instructor burden
- **Why**: Instructors would need to create KC entries separately before using them

### 2. Lazy Creation (Create KC on First Use)
- **Rejected**: Delays BKT tracking until first submission
- **Why**: First students to attempt problem wouldn't get tracked properly

### 3. Foreign Key from Problem to KnowledgeComponent
- **Rejected**: Breaks flexibility of dynamic KC lists
- **Why**: Problems often have 3-5 KCs, would need junction table, over-engineered

### 4. Denormalize: Remove KnowledgeComponent Table
- **Rejected**: Loses canonical KC list and descriptions
- **Why**: BKT needs stable KC IDs, not just names

## Consequences

### Positive
- **Accurate Mastery Tracking**: BKT works for all KCs, shows real progress
- **Zero Instructor Burden**: Auto-sync happens transparently
- **Data Integrity**: Guaranteed sync between tables
- **Dashboard Reliability**: Instructors can trust mastery metrics
- **Idempotent**: Safe to re-run migration script
- **Backward Compatible**: Existing problems work unchanged

### Negative
- **Slight Performance Overhead**: N upserts per problem creation (N = # KCs)
- **Potential Duplicates**: If KC names have slight variations (e.g., "arrays" vs "Arrays")
- **No KC Deletion**: Orphaned KCs remain in table if removed from all problems

### Mitigations
- **Performance**: Upserts are fast (indexed on unique name), parallel execution possible
- **Naming**: Document KC naming conventions for instructors
- **Cleanup**: Future: Add admin tool to detect and merge duplicate KCs
- **Orphans**: Future: Add periodic cleanup script to remove unused KCs

## Implementation Details

### Data Flow (Before Fix)
```
Instructor creates problem with KCs: ['arrays', 'hash_maps']
    ↓
Problem saved: knowledgeComponents = ['arrays', 'hash_maps']
    ↓
KnowledgeComponent table: (unchanged - missing entries!)
    ↓
Student solves problem
    ↓
BKT tries: SELECT * FROM KnowledgeComponent WHERE name = 'arrays'
    ↓
Not found → Error or default pKnown = 0.2
    ↓
Dashboard shows: 20% mastery (wrong!)
```

### Data Flow (After Fix)
```
Instructor creates problem with KCs: ['arrays', 'hash_maps']
    ↓
Backend upserts each KC to KnowledgeComponent table
    ↓
Problem saved: knowledgeComponents = ['arrays', 'hash_maps']
    ↓
KnowledgeComponent table: { name: 'arrays' }, { name: 'hash_maps' }
    ↓
Student solves problem (correct)
    ↓
BKT finds KC → Updates pKnown: 0.2 → 0.35 (using Bayesian formula)
    ↓
Dashboard shows: 35% mastery → 50% → 65% (accurate progress!)
```

### Database Schema (No Changes Required)
```prisma
model Problem {
  knowledgeComponents String[] // Unchanged
  // ... other fields
}

model KnowledgeComponent {
  id          String @id @default(uuid())
  name        String @unique // ← Matches Problem.knowledgeComponents[i]
  description String
  bktStates   BKTState[]
}

model BKTState {
  userId String
  kcId   String // Foreign key to KnowledgeComponent.id
  pKnown Float  @default(0.2)
  // ... other fields
  @@unique([userId, kcId])
}
```

### Migration Script Output
```
🔄 Starting Knowledge Component sync...

📊 Found 50 problems

🔍 Found 25 unique knowledge components:
   1. arrays
   2. dynamic_programming
   3. hash_maps
   ...

✅ 7 KCs already exist in database

   ➕ Created: two_pointers
   ➕ Created: greedy
   ...

✨ Created 18 new Knowledge Components

════════════════════════════════════════
📈 SYNC COMPLETE
════════════════════════════════════════
Total KCs in database: 25
KCs created this run: 18
KCs already existed: 7
════════════════════════════════════════
```

## Rollout Plan

### Phase 1: Deploy Auto-Sync (Immediate)
1. Commit changes to `problems.ts`
2. Deploy backend to Cloud Run
3. New problems auto-create KCs ✅

### Phase 2: Run Migration (Within 24 hours)
1. Run `npx ts-node scripts/sync-knowledge-components.ts`
2. Verify all KCs synced to table
3. Monitor BKT updates for correct mastery values

### Phase 3: Validation (1 week)
1. Check dashboard: Mastery values should vary (not all 20%)
2. Monitor logs: No "KC not found" errors
3. Instructor feedback: Mastery metrics make sense

### Phase 4: Monitoring (Ongoing)
1. Alert if BKT error rate > 1%
2. Weekly check: Compare unique KCs in problems vs table
3. Monthly: Review for duplicate/orphaned KCs

## Success Metrics

### Before Fix
- ❌ All students: 11-20% mastery across all KCs
- ❌ BKT errors: 5-10 per day ("KC not found")
- ❌ Instructor complaints: "Mastery doesn't change"

### After Fix
- ✅ Student mastery: Varies 0-100% based on performance
- ✅ BKT errors: 0 per day
- ✅ Instructor feedback: "Mastery reflects reality"
- ✅ Data integrity: 100% of KCs in both places

## Related ADRs
- ADR 002: Bayesian Knowledge Tracing (depends on KC sync)
- ADR 001: Microservices Architecture (context for backend service)
