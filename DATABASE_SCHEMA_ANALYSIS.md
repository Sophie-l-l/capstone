# Database Schema Analysis & Design Justification

## Quick Reference Commands

### 1. View table headers/samples:
```bash
# View first 5 rows of any table
PGPASSWORD='EduCode2025SecureDB!' psql -h localhost -p 5433 -U postgres -d educode -c "SELECT * FROM table_name LIMIT 5;"

# View specific columns
PGPASSWORD='EduCode2025SecureDB!' psql -h localhost -p 5433 -U postgres -d educode -c "SELECT column1, column2 FROM table_name LIMIT 10;"
```

### 2. View table schema:
```bash
# Detailed schema for a specific table
PGPASSWORD='EduCode2025SecureDB!' psql -h localhost -p 5433 -U postgres -d educode -c "\d table_name"

# List all tables
PGPASSWORD='EduCode2025SecureDB!' psql -h localhost -p 5433 -U postgres -d educode -c "\dt"

# Get column info
PGPASSWORD='EduCode2025SecureDB!' psql -h localhost -p 5433 -U postgres -d educode -c "\d+ table_name"
```

### 3. Count records in tables:
```bash
PGPASSWORD='EduCode2025SecureDB!' psql -h localhost -p 5433 -U postgres -d educode -c "SELECT 'users' as table_name, COUNT(*) as count FROM users UNION ALL SELECT 'problems', COUNT(*) FROM problems UNION ALL SELECT 'submissions', COUNT(*) FROM submissions;"
```

---

## Database Tables (16 Total)

### **Core Entities**

#### 1. **users**
**Purpose**: Store user accounts (students and instructors)

**Schema**:
```sql
id          TEXT PRIMARY KEY
email       TEXT UNIQUE NOT NULL
username    TEXT UNIQUE NOT NULL
name        TEXT
passwordHash TEXT NOT NULL
role        TEXT NOT NULL  -- 'student' or 'instructor'
createdAt   TIMESTAMP DEFAULT NOW()
updatedAt   TIMESTAMP
```

**Design Justification**:
- ✅ **Single table for all users** - Simplifies authentication and access control
- ✅ **Role-based** - Uses `role` field instead of separate tables
- ✅ **UUID as TEXT** - Better for distributed systems, URL-safe

**Alternative Design**:
```sql
-- Option: Separate tables
students (id, userId, gpa, major, ...)
instructors (id, userId, department, ...)
```
**Pros**: More specific fields per role, easier to add role-specific data
**Cons**: Complex queries (always need JOINs), harder to switch roles
**Verdict**: ✅ Current design is better for this use case

---

#### 2. **problems**
**Purpose**: Store coding problem definitions

**Schema**:
```sql
id                  TEXT PRIMARY KEY
title               TEXT NOT NULL
difficulty          TEXT NOT NULL  -- 'easy', 'medium', 'hard'
description         TEXT NOT NULL
inputFormat         TEXT NOT NULL
outputFormat        TEXT NOT NULL
constraints         TEXT[]  -- Array of constraint strings
topics              TEXT[]  -- e.g., ['Array', 'Hash Table']
knowledgeComponents TEXT[]  -- e.g., ['arrays', 'hash_maps']
timeLimit           INTEGER DEFAULT 5
memoryLimit         INTEGER DEFAULT 256
acceptanceRate      FLOAT DEFAULT 0
totalSubmissions    INTEGER DEFAULT 0
source              TEXT
createdAt           TIMESTAMP
updatedAt           TIMESTAMP
createdBy           TEXT REFERENCES users(id)
```

**Design Justification**:
- ✅ **Arrays for topics/KCs** - Flexible, allows multiple tags without junction tables
- ✅ **Embedded metadata** - acceptanceRate and totalSubmissions for quick access
- ✅ **Denormalized** - No separate topics/tags tables = faster queries

**Alternative Design**:
```sql
-- Option: Normalized with junction tables
problems (id, title, difficulty, ...)
topics (id, name)
problem_topics (problemId, topicId)
knowledge_components (id, name)
problem_kcs (problemId, kcId)
```
**Pros**: Referential integrity, easier to manage topic list
**Cons**: Requires 2-3 JOINs for every problem query, slower, more complex
**Verdict**: ✅ Current design (arrays) is better for read-heavy workload

---

#### 3. **test_cases**
**Purpose**: Store input/output test cases for problems

**Schema**:
```sql
id          TEXT PRIMARY KEY
problemId   TEXT REFERENCES problems(id) ON DELETE CASCADE
input       TEXT NOT NULL
output      TEXT NOT NULL  -- expected output
explanation TEXT
isHidden    BOOLEAN DEFAULT false
points      INTEGER DEFAULT 10
```

**Design Justification**:
- ✅ **Separate table** - Problems have variable number of test cases (1:N)
- ✅ **Cascade delete** - Removing problem auto-removes test cases
- ✅ **Scoring support** - `points` field for weighted grading

**Alternative Design**:
```sql
-- Option: Embed in problems table
problems (
  id,
  title,
  testCases JSONB  -- [{input, output, points}, ...]
)
```
**Pros**: Single query to get problem + tests, simpler schema
**Cons**: JSONB queries are harder, can't enforce constraints, harder to update individual tests
**Verdict**: ✅ Separate table is better for maintainability

---

### **Bayesian Knowledge Tracing (BKT) System**

#### 4. **KnowledgeComponent**
**Purpose**: Define trackable skills (the "what" of BKT)

**Schema**:
```sql
id          TEXT PRIMARY KEY
name        TEXT UNIQUE NOT NULL  -- e.g., 'arrays', 'recursion'
description TEXT NOT NULL
createdAt   TIMESTAMP DEFAULT NOW()
```

**Design Justification**:
- ✅ **Separate table** - Central registry of all trackable skills
- ✅ **Referenced by BKTState** - Ensures only valid KCs are tracked
- ✅ **Unique names** - Prevents duplicate skill definitions

**Why Not Embedded in Problems?**
- Problems have KC arrays (flexibility)
- This table ensures consistency: if 10 problems use "arrays", they all reference the same concept
- Allows adding metadata (difficulty, prerequisites, etc.) later

---

#### 5. **BKTState**
**Purpose**: Track student mastery of each knowledge component

**Schema**:
```sql
id          TEXT PRIMARY KEY
userId      TEXT REFERENCES users(id)
kcId        TEXT REFERENCES KnowledgeComponent(id)
pKnown      FLOAT DEFAULT 0.2    -- Probability student knows this KC
attempts    INTEGER DEFAULT 0    -- Total attempts
corrects    INTEGER DEFAULT 0    -- Correct attempts
lastUpdated TIMESTAMP DEFAULT NOW()

UNIQUE(userId, kcId)  -- One state per student per KC
```

**Design Justification**:
- ✅ **One row per student-KC pair** - Efficient updates, O(1) lookup
- ✅ **Denormalized stats** - `attempts` and `corrects` cached for performance
- ✅ **Unique constraint** - Prevents duplicate tracking

**Alternative Design**:
```sql
-- Option: Store all updates as events
bkt_events (
  id, userId, kcId, 
  pKnownBefore, pKnownAfter, 
  wasCorrect, timestamp
)
-- Compute current state by aggregating events
```
**Pros**: Full history, audit trail, can replay/recompute
**Cons**: Every mastery query requires aggregation (slow), storage overhead
**Verdict**: ✅ Current design better for real-time dashboards

---

### **Submission & Error Tracking**

#### 6. **submissions**
**Purpose**: Store student code submissions

**Schema**:
```sql
id              TEXT PRIMARY KEY
userId          TEXT REFERENCES users(id)
problemId       TEXT REFERENCES problems(id)
code            TEXT NOT NULL
language        TEXT NOT NULL
status          TEXT NOT NULL  -- 'accepted', 'wrong_answer', 'runtime_error', etc.
testCasesPassed INTEGER
totalTestCases  INTEGER
runtime         FLOAT
memory          INTEGER
submittedAt     TIMESTAMP DEFAULT NOW()
compileOutput   TEXT
stderr          TEXT
judgeStatusId   INTEGER  -- Judge0 status code
```

**Design Justification**:
- ✅ **Denormalized results** - Stores test pass count, runtime, memory for quick retrieval
- ✅ **Complete execution record** - Can reconstruct what happened without re-running
- ✅ **Foreign keys** - Maintains referential integrity

**Alternative Design**:
```sql
-- Option: Separate tables for results
submissions (id, userId, problemId, code, language, submittedAt)
submission_results (submissionId, status, runtime, memory, ...)
test_case_results (submissionId, testCaseId, passed, output, ...)
```
**Pros**: Normalized, can store per-test-case results
**Cons**: Requires JOINs for every submission view, overkill for most queries
**Verdict**: ⚠️ Hybrid approach might be better - current table + optional detailed results

---

#### 7. **submission_errors**
**Purpose**: Store error details for failed submissions

**Schema**:
```sql
id            TEXT PRIMARY KEY
submissionId  TEXT UNIQUE REFERENCES submissions(id) ON DELETE CASCADE
language      TEXT NOT NULL
compileOutput TEXT
stderr        TEXT
signatureId   TEXT REFERENCES error_signatures(id)
createdAt     TIMESTAMP DEFAULT NOW()
```

**Design Justification**:
- ✅ **1:1 relationship** - One error record per failed submission
- ✅ **Links to signature** - Connects to AI classification
- ✅ **Cascade delete** - Removing submission cleans up error

**Why Separate from submissions?**
- Not all submissions have errors (accepted submissions)
- Keeps `submissions` table lean
- Can add error-specific fields without bloating main table

---

#### 8. **error_signatures**
**Purpose**: Store AI-classified error patterns

**Schema**:
```sql
id              TEXT PRIMARY KEY
hash            TEXT UNIQUE  -- SHA-256 of normalized error
surfaceError    TEXT  -- 'Syntax', 'Runtime', 'Logic', etc.
specificError   TEXT  -- Detailed description
compilerExcerpt TEXT  -- Code snippet causing error
cognitiveCause  TEXT  -- 'STRUCTURAL_BLINDNESS', 'MISCONCEPTION', etc.
bloomLevel      TEXT  -- 'Apply', 'Understand', 'Remember'
reasoning       TEXT  -- LLM explanation
source          TEXT  -- 'llm', 'rule-based'
confidence      FLOAT
```

**Design Justification**:
- ✅ **Deduplicated** - Same error pattern stored once, referenced by many submissions
- ✅ **Academic framework** - IEEE 1044 + Zehetmeier cognitive causes + Bloom taxonomy
- ✅ **Hash-based** - Quick lookup for similar errors

**Alternative Design**:
```sql
-- Option: Embed in submission_errors
submission_errors (
  id, submissionId, 
  compileOutput, stderr,
  surfaceError, cognitiveCause, bloomLevel, ...  -- All in one table
)
```
**Pros**: Simpler schema, no JOINs
**Cons**: Massive duplication (same error pattern stored 1000x), wastes space, hard to update classifications
**Verdict**: ✅ Normalized design is essential here

---

#### 9. **error_clusters**
**Purpose**: Group similar errors for pattern analysis

**Schema**:
```sql
id          TEXT PRIMARY KEY
name        TEXT NOT NULL
description TEXT
signatureIds TEXT[]  -- Array of related error_signature IDs
createdAt   TIMESTAMP
```

**Design Justification**:
- ✅ **Meta-organization** - Groups signatures into higher-level patterns
- ✅ **Flexible** - One signature can belong to multiple clusters

**Use Case**: 
- Cluster: "Array Index Errors" → signatures for off-by-one, negative index, out of bounds
- Enables curriculum planning: "50% of students struggle with array indexing"

---

### **Class Management**

#### 10. **classes**
**Purpose**: Instructor-created course sections

**Schema**:
```sql
id           TEXT PRIMARY KEY
name         TEXT NOT NULL
code         TEXT UNIQUE  -- e.g., 'CS101-FALL-2025'
description  TEXT
instructorId TEXT REFERENCES users(id)
semester     TEXT
year         INTEGER
createdAt    TIMESTAMP
```

**Design Justification**:
- ✅ **Simple structure** - Minimal fields for MVP
- ✅ **Unique code** - Easy for students to join
- ✅ **Instructor ownership** - One instructor per class

---

#### 11. **class_enrollments**
**Purpose**: Student-class many-to-many relationship

**Schema**:
```sql
id        TEXT PRIMARY KEY
classId   TEXT REFERENCES classes(id) ON DELETE CASCADE
studentId TEXT REFERENCES users(id) ON DELETE CASCADE
enrolledAt TIMESTAMP DEFAULT NOW()

UNIQUE(classId, studentId)  -- Prevent duplicate enrollments
```

**Design Justification**:
- ✅ **Junction table** - Standard M:N pattern
- ✅ **Unique constraint** - One enrollment per student-class pair
- ✅ **Cascade delete** - Clean up when class or student deleted

---

### **Problem Sets & Assignments**

#### 12. **problem_sets**
**Purpose**: Instructor-curated collections of problems

**Schema**:
```sql
id          TEXT PRIMARY KEY
title       TEXT NOT NULL
description TEXT
classId     TEXT REFERENCES classes(id)
createdBy   TEXT REFERENCES users(id)
dueDate     TIMESTAMP
createdAt   TIMESTAMP
```

#### 13. **problem_set_items**
**Purpose**: Problems in a set (junction table)

**Schema**:
```sql
id           TEXT PRIMARY KEY
problemSetId TEXT REFERENCES problem_sets(id) ON DELETE CASCADE
problemId    TEXT REFERENCES problems(id) ON DELETE CASCADE
order        INTEGER  -- Display order
points       INTEGER DEFAULT 10

UNIQUE(problemSetId, problemId)
```

**Design Justification**:
- ✅ **Flexible assignments** - Same problem can be in multiple sets
- ✅ **Ordering** - `order` field for custom sequencing
- ✅ **Per-assignment points** - Same problem worth different points in different sets

---

### **Gamification**

#### 14. **achievements**
**Purpose**: Define achievement/badge types

**Schema**:
```sql
id          TEXT PRIMARY KEY
name        TEXT NOT NULL
description TEXT
icon        TEXT
criteria    TEXT  -- JSON or description of how to earn
```

#### 15. **user_achievements**
**Purpose**: Track which users earned which achievements

**Schema**:
```sql
id            TEXT PRIMARY KEY
userId        TEXT REFERENCES users(id)
achievementId TEXT REFERENCES achievements(id)
earnedAt      TIMESTAMP DEFAULT NOW()

UNIQUE(userId, achievementId)
```

**Design Justification**:
- ✅ **Separation** - Achievement definitions separate from user progress
- ✅ **Scalable** - Add new achievements without schema changes
- ✅ **Timestamp** - Track when earned for leaderboards

---

## Overall Design Philosophy

### ✅ **Strengths**

1. **Hybrid Normalization**
   - Core entities (users, problems) are normalized
   - Arrays used for flexible lists (topics, KCs) where JOINs would hurt performance
   - Error signatures deduplicated (essential for AI classification)

2. **Performance-First**
   - Denormalized stats (acceptanceRate, pKnown) for dashboard queries
   - No unnecessary JOINs for common queries
   - Array fields avoid junction table overhead

3. **Academic Framework Integration**
   - BKT (Bayesian Knowledge Tracing) as first-class citizen
   - IEEE 1044 + Zehetmeier + Bloom taxonomy for errors
   - Supports research-backed pedagogy

4. **Soft Delete Compatible**
   - Uses TEXT UUIDs (easier to archive)
   - CASCADE constraints maintain integrity

### ⚠️ **Trade-offs**

1. **Array Fields (topics, knowledgeComponents)**
   - **Pro**: Fast, flexible, no JOINs
   - **Con**: Can't enforce referential integrity, harder to query "all problems with topic X"
   - **Mitigation**: Use GIN indexes for array queries

2. **Denormalized Stats**
   - **Pro**: O(1) dashboard queries
   - **Con**: Must update multiple places (e.g., acceptanceRate when submission added)
   - **Mitigation**: Use database triggers or application-level transactions

3. **Single Users Table**
   - **Pro**: Simple authentication, easy role switching
   - **Con**: Can't add many role-specific fields
   - **Mitigation**: Use JSONB `metadata` column if needed

### 🔄 **Recommended Improvements**

1. **Add Indexes**:
```sql
CREATE INDEX idx_submissions_user ON submissions(userId);
CREATE INDEX idx_submissions_problem ON submissions(problemId);
CREATE INDEX idx_bkt_user ON BKTState(userId);
CREATE GIN INDEX idx_problems_topics ON problems USING GIN(topics);
CREATE GIN INDEX idx_problems_kcs ON problems USING GIN(knowledgeComponents);
```

2. **Add Soft Delete**:
```sql
ALTER TABLE problems ADD COLUMN deletedAt TIMESTAMP;
ALTER TABLE users ADD COLUMN deletedAt TIMESTAMP;
```

3. **Add Audit Trail** (Optional):
```sql
CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  tableName TEXT,
  recordId TEXT,
  action TEXT,  -- 'INSERT', 'UPDATE', 'DELETE'
  userId TEXT,
  changes JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

---

## Comparison with Alternatives

### Alternative 1: Fully Normalized (3NF)
**Design**: Separate tables for everything (topics, tags, test results)
- **Pro**: Referential integrity, easy to manage controlled vocabularies
- **Con**: 5-7 JOINs per problem query, slow dashboards
- **Verdict**: ❌ Too slow for real-time adaptive learning

### Alternative 2: Document Database (MongoDB)
**Design**: Embed everything in documents
```json
{
  "problem": {...},
  "testCases": [...],
  "submissions": [...]
}
```
- **Pro**: Single query, flexible schema
- **Con**: No transactions, data duplication, hard to query across entities
- **Verdict**: ❌ BKT requires atomic updates across tables

### Alternative 3: Event Sourcing
**Design**: Store all events, compute state on read
- **Pro**: Full audit trail, time travel, replayable
- **Con**: Complex, slow reads, overkill for MVP
- **Verdict**: ❌ Not worth complexity for education platform

### Alternative 4: Current Hybrid (PostgreSQL + Arrays)
- **Pro**: Fast reads, flexible, transactional, battle-tested
- **Con**: Some duplication, array queries not as elegant as JOINs
- **Verdict**: ✅ **BEST CHOICE** - balances performance, flexibility, and maintainability

---

## Entity Relationship Diagram

```
┌─────────────┐
│   users     │
└──────┬──────┘
       │
       ├──────> submissions ──> problems ──> test_cases
       │            │
       │            └──> submission_errors ──> error_signatures ──> error_clusters
       │
       ├──────> BKTState ──> KnowledgeComponent
       │
       ├──────> class_enrollments ──> classes ──> problem_sets ──> problem_set_items
       │
       └──────> user_achievements ──> achievements
```

---

## Conclusion

The current database design is **well-suited** for an adaptive coding education platform:

✅ Optimized for read-heavy workloads (student dashboards)  
✅ Supports complex BKT tracking without performance penalties  
✅ Flexible enough for instructor customization  
✅ Maintainable with PostgreSQL's ACID guarantees  

The hybrid normalization approach (normalized core + denormalized stats + array fields) is a pragmatic choice that prioritizes **developer experience** and **runtime performance** over theoretical purity.
