# ADR 004: Multi-Dimensional Error Classification Taxonomy

## Status
Accepted

## Date
2024-12-01

## Context
The platform needs to classify student coding errors to provide meaningful insights for:
- Students: Understand what went wrong and how to improve
- Instructors: Identify common misconceptions and struggling students
- System: Personalize learning recommendations

We need a taxonomy that captures both technical and cognitive aspects of errors.

## Decision
We will use a **three-dimensional error classification model** combining established educational taxonomies:

### 1. Surface Error Category (IEEE 1044 Standard)
Technical classification of what went wrong:
- **Syntax**: Grammatical errors in code structure
- **Logic**: Incorrect algorithm or control flow
- **Runtime**: Errors during execution (IndexError, NullPointer, etc.)
- **Semantic**: Code runs but produces wrong results
- **Data**: Incorrect data types or structures
- **Interface**: Function signature or API usage errors
- **Algorithm**: Inefficient or incorrect algorithmic approach
- **Computation**: Mathematical calculation errors
- **Environment**: Dependency or configuration issues
- **Resource**: Memory/time limit exceeded
- **Concurrency**: Threading or async errors (future)
- **Other**: Edge cases not fitting above

### 2. Cognitive Cause (Zehetmeier et al. Framework)
Why the error occurred from learning science perspective:
- **Lack of Knowledge**: Student doesn't know the concept
- **Misunderstanding**: Incorrect mental model
- **Misconception**: Systematic false belief
- **Carelessness**: Simple mistake despite knowing
- **Incomplete Understanding**: Partial knowledge
- **Problem Comprehension**: Didn't understand requirements
- **Transfer Failure**: Can't apply knowledge to new context
- **Other**: Complex or multiple causes

### 3. Bloom's Taxonomy Level
Cognitive skill level required to fix the error:
- **Remember**: Recall syntax or API
- **Understand**: Comprehend concept explanation
- **Apply**: Use known concept in new situation
- **Analyze**: Debug and trace execution
- **Evaluate**: Judge algorithm correctness
- **Create**: Design new solution approach
- **Not Applicable**: Error not skill-related

## Alternatives Considered

### 1. Single-Dimension (Error Type Only)
- **Rejected**: Too shallow for educational insights
- **Why**: Doesn't capture learning needs or cognitive processes

### 2. CompileError vs RuntimeError vs LogicError
- **Rejected**: Too coarse-grained
- **Why**: "Runtime Error" doesn't distinguish IndexError from NullPointer

### 3. Custom Taxonomy from Scratch
- **Rejected**: Reinventing the wheel
- **Why**: Established taxonomies are research-validated

## Consequences

### Positive
- **Rich Insights**: Multi-dimensional view of student errors
- **Standardized**: IEEE 1044 and Bloom's are industry standards
- **Research-Backed**: Zehetmeier framework from learning sciences
- **Actionable**: Maps directly to intervention strategies
- **Comparable**: Can compare with other educational systems

### Negative
- **Classification Complexity**: LLM must predict 3 values per error
- **Potential Inconsistency**: LLM may classify differently over time
- **Training Data Needs**: Need examples for all combinations
- **Storage Overhead**: 3 fields vs 1 in database

### Mitigations
- **Validation**: Enum constraints prevent invalid categories
- **LLM Prompting**: Detailed examples in classification prompt
- **Auto-correction**: Map common LLM mistakes (e.g., "syntax" → "Syntax")
- **Monitoring**: Track classification distribution to detect drift

## Implementation Details

### Type Definitions (TypeScript)
```typescript
enum SurfaceErrorCategory {
  Syntax = "Syntax",
  Logic = "Logic",
  Runtime = "Runtime",
  Semantic = "Semantic",
  Data = "Data",
  Interface = "Interface",
  Algorithm = "Algorithm",
  Computation = "Computation",
  Environment = "Environment",
  Resource = "Resource",
  Concurrency = "Concurrency",
  Other = "Other"
}

enum CognitiveCause {
  LackOfKnowledge = "Lack of Knowledge",
  Misunderstanding = "Misunderstanding",
  Misconception = "Misconception",
  Carelessness = "Carelessness",
  IncompleteUnderstanding = "Incomplete Understanding",
  ProblemComprehension = "Problem Comprehension",
  TransferFailure = "Transfer Failure",
  Other = "Other"
}

enum BloomLevel {
  Remember = "Remember",
  Understand = "Understand",
  Apply = "Apply",
  Analyze = "Analyze",
  Evaluate = "Evaluate",
  Create = "Create",
  NotApplicable = "Not Applicable"
}
```

### Database Schema
```prisma
model ErrorSignature {
  id             String   @id @default(uuid())
  language       String
  surfaceError   String   // SurfaceErrorCategory enum
  cognitiveCause String   // CognitiveCause enum
  bloomLevel     String   // BloomLevel enum
  errorPattern   String   // Regex or substring pattern
  suggestion     String   // How to fix
  createdAt      DateTime @default(now())
  
  errors SubmissionError[]
}
```

### LLM Classification Prompt
```
Classify this coding error in 3 dimensions:

1. Surface Error (IEEE 1044): [Syntax|Logic|Runtime|Semantic|Data|Interface|Algorithm|Computation|Environment|Resource|Concurrency|Other]
2. Cognitive Cause (Zehetmeier): [Lack of Knowledge|Misunderstanding|Misconception|Carelessness|Incomplete Understanding|Problem Comprehension|Transfer Failure|Other]
3. Bloom's Level: [Remember|Understand|Apply|Analyze|Evaluate|Create|Not Applicable]

Code: {source_code}
Error: {error_output}
Language: {language}

Respond in JSON format.
```

### Validation
- Python service validates LLM output against allowed values
- Auto-corrects common mistakes (case sensitivity)
- Rejects and logs invalid classifications
- Prevents "Unknown" from entering database

### Analytics Use Cases
- **By Surface Error**: Top 5 error types (chart on dashboard)
- **By Cognitive Cause**: Identify systematic misconceptions
- **By Bloom Level**: Assess if problems match skill level
- **Cross-dimension**: "Students struggle with Logic errors due to Misconceptions at Apply level"
