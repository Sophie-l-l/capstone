# ADR 002: Bayesian Knowledge Tracing for Mastery Modeling

## Status
Accepted

## Date
2024-11-20

## Context
The adaptive learning platform needs to track student mastery of programming concepts (Knowledge Components) to provide personalized recommendations. We need a model that:
- Updates in real-time as students submit solutions
- Provides probabilistic mastery estimates
- Works with sparse data (few submissions per student)
- Is computationally efficient

## Decision
We will implement Bayesian Knowledge Tracing (BKT) with local computation in the backend service.

### BKT Parameters
- **pKnown**: Probability student knows the KC (starts at 0.2)
- **Slip (S)**: 0.05 - Probability of error despite knowing
- **Guess (G)**: 0.2 - Probability of success without knowing
- **Transition (T)**: 0.1 - Probability of learning from attempt

### Update Formula
```
If correct:
  P(know | correct) = P(know) * (1 - S) / [P(know) * (1 - S) + (1 - P(know)) * G]
  
If incorrect:
  P(know | incorrect) = P(know) * S / [P(know) * S + (1 - P(know)) * (1 - G)]

Then apply learning:
  pKnown_new = P(know | evidence) + (1 - P(know | evidence)) * T
```

### Data Model
```typescript
BKTState {
  userId: String
  kcId: String
  pKnown: Float (0.0 - 1.0)
  attempts: Int
  corrects: Int
  lastUpdated: DateTime
  @@unique([userId, kcId])
}
```

## Alternatives Considered

### 1. Item Response Theory (IRT)
- **Rejected**: Requires many submissions per problem to estimate difficulty
- **Why**: We have sparse data and need real-time updates

### 2. Deep Knowledge Tracing (DKT)
- **Rejected**: Requires large training dataset and GPU resources
- **Why**: Overkill for our scale, adds infrastructure complexity

### 3. Performance Factor Analysis (PFA)
- **Rejected**: Similar to BKT but more complex parameter estimation
- **Why**: BKT is simpler and well-studied in educational literature

## Consequences

### Positive
- **Real-time Updates**: Instant mastery calculation after each submission
- **Cold Start Handling**: Works with minimal data (default pKnown = 0.2)
- **Interpretable**: Instructors can understand mastery percentages
- **Efficient**: Simple Bayesian update, no ML model inference
- **Proven**: Well-established in intelligent tutoring systems

### Negative
- **Fixed Parameters**: S, G, T are constants (not learned per student/KC)
- **Independence Assumption**: Treats KCs as independent (ignores prerequisites)
- **Binary Outcomes**: Only uses correct/incorrect (ignores partial credit)

### Mitigations
- Monitor actual performance vs predictions to tune S, G, T parameters
- Plan for future: Add KC prerequisite relationships to database schema
- Store detailed submission data for future model improvements

## Implementation Details

### Knowledge Component Sync
- **Problem**: `Problem.knowledgeComponents` (string[]) must match `KnowledgeComponent` table
- **Solution**: Auto-sync KCs on problem creation using upsert
- **Migration**: One-time script to sync existing problems

### Database Design
- `KnowledgeComponent` table with unique name constraint
- `BKTState` with composite unique key `(userId, kcId)`
- Atomic updates in codeExecution transaction

### Integration Points
- **Trigger**: After submission is graded (status determined)
- **Input**: userId, kcName, correct (boolean)
- **Output**: Updated pKnown value
- **Display**: Student dashboard shows mastery as percentage
