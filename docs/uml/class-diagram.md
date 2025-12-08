# Class Diagram - EduCode Adaptive Platform

```plantuml
@startuml
!theme plain
skinparam linetype ortho
skinparam groupInheritance 2

title Class Diagram - Core Domain Models

package "User Management" {
    class User {
        +id: String
        +email: String
        +name: String
        +role: String
        +passwordHash: String
        +createdAt: DateTime
        --
        +authenticate(): Boolean
        +hasRole(role: String): Boolean
    }
    
    enum UserRole {
        STUDENT
        INSTRUCTOR
        ADMIN
    }
}

package "Problem Domain" {
    class Problem {
        +id: String
        +title: String
        +difficulty: String
        +description: String
        +inputFormat: String
        +outputFormat: String
        +constraints: String[]
        +topics: String[]
        +knowledgeComponents: String[]
        +timeLimit: Int
        +memoryLimit: Int
        +acceptanceRate: Float
        +totalSubmissions: Int
        +createdAt: DateTime
        --
        +addTestCase(tc: TestCase): void
        +updateStatistics(): void
        +validateSolution(code: String): Boolean
    }
    
    class TestCase {
        +id: String
        +problemId: String
        +input: String
        +output: String
        +explanation: String
        +isHidden: Boolean
        +points: Int
        --
        +evaluate(actualOutput: String): Boolean
    }
    
    enum Difficulty {
        EASY
        MEDIUM
        HARD
    }
}

package "Submission Domain" {
    class Submission {
        +id: String
        +userId: String
        +problemId: String
        +code: String
        +language: String
        +status: String
        +testCasesPassed: Int
        +totalTestCases: Int
        +runtime: Float
        +memory: Int
        +compileOutput: String
        +stderr: String
        +submittedAt: DateTime
        --
        +execute(): SubmissionResult
        +calculateScore(): Float
    }
    
    class SubmissionError {
        +id: String
        +submissionId: String
        +language: String
        +compileOutput: String
        +stderr: String
        +signatureId: String
        +createdAt: DateTime
        --
        +classify(): ErrorClassification
    }
    
    class ErrorSignature {
        +id: String
        +language: String
        +surfaceError: String
        +cognitiveCause: String
        +bloomLevel: String
        +errorPattern: String
        +suggestion: String
        +createdAt: DateTime
        --
        +matches(error: String): Boolean
        +getSuggestion(): String
    }
    
    enum SubmissionStatus {
        ACCEPTED
        WRONG_ANSWER
        RUNTIME_ERROR
        TIME_LIMIT_EXCEEDED
        COMPILATION_ERROR
        MEMORY_LIMIT_EXCEEDED
    }
    
    enum SurfaceErrorCategory {
        SYNTAX
        LOGIC
        RUNTIME
        SEMANTIC
        DATA
        INTERFACE
        ALGORITHM
        COMPUTATION
        ENVIRONMENT
        RESOURCE
    }
}

package "Knowledge Tracking" {
    class KnowledgeComponent {
        +id: String
        +name: String
        +description: String
        +createdAt: DateTime
        --
        +syncFromProblem(kcNames: String[]): void
    }
    
    class BKTState {
        +id: String
        +userId: String
        +kcId: String
        +pKnown: Float
        +attempts: Int
        +corrects: Int
        +lastUpdated: DateTime
        --
        +update(correct: Boolean): void
        +calculatePosterior(correct: Boolean): Float
        +applyLearning(posterior: Float): Float
    }
    
    class BKTParameters {
        +slip: Float = 0.05
        +guess: Float = 0.2
        +transition: Float = 0.1
        --
        +getPosterior(pKnown: Float, correct: Boolean): Float
    }
}

package "Class Management" {
    class Class {
        +id: String
        +name: String
        +description: String
        +instructorId: String
        +createdAt: DateTime
        --
        +enrollStudent(studentId: String): void
        +assignProblemSet(psId: String): void
        +getPerformanceMetrics(): ClassMetrics
    }
    
    class ClassStudent {
        +classId: String
        +studentId: String
        +enrolledAt: DateTime
        --
        +getProgress(): StudentProgress
    }
    
    class ProblemSet {
        +id: String
        +name: String
        +description: String
        +classId: String
        +dueDate: DateTime
        +isPublished: Boolean
        +createdAt: DateTime
        --
        +addProblem(problemId: String, order: Int): void
        +publish(): void
        +getCompletionRate(): Float
    }
    
    class ProblemSetItem {
        +id: String
        +problemSetId: String
        +problemId: String
        +order: Int
        --
        +reorder(newOrder: Int): void
    }
}

' Relationships - User
User "1" -- "0..*" Submission : submits
User "1" -- "0..*" Problem : creates
User "1" -- "0..*" BKTState : has mastery
User "1" -- "0..*" Class : instructs
User "0..*" -- "0..*" Class : enrolled in
(User, Class) .. ClassStudent

' Relationships - Problem
Problem "1" -- "1..*" TestCase : contains
Problem "1" -- "0..*" Submission : receives
Problem "0..*" -- "0..*" ProblemSet : included in
(Problem, ProblemSet) .. ProblemSetItem
Problem ..> Difficulty : uses
Problem ..> KnowledgeComponent : references

' Relationships - Submission
Submission ..> SubmissionStatus : has
Submission "1" -- "0..1" SubmissionError : may have
SubmissionError "0..*" -- "0..1" ErrorSignature : classified by
ErrorSignature ..> SurfaceErrorCategory : categorized as

' Relationships - Knowledge Tracking
KnowledgeComponent "1" -- "0..*" BKTState : tracked by
BKTState ..> BKTParameters : uses
User "1" -- "0..*" BKTState : has states

' Relationships - Class Management
Class "1" -- "0..*" ProblemSet : contains
Class "1" -- "0..*" ClassStudent : has enrollments
ProblemSet "1" -- "0..*" ProblemSetItem : contains

@enduml
```

## Domain Model Description

### User Management
- **User**: Core entity representing students, instructors, and admins
- **UserRole**: Enum defining access levels and permissions

### Problem Domain
- **Problem**: Programming challenges with test cases
- **TestCase**: Input/output pairs for validating solutions
- **Difficulty**: Three-tier difficulty classification

### Submission Domain
- **Submission**: Student's code submission with execution results
- **SubmissionError**: Detailed error information for failed submissions
- **ErrorSignature**: Pattern-matched error classifications with suggestions
- **SubmissionStatus**: All possible submission outcomes
- **SurfaceErrorCategory**: IEEE 1044 error taxonomy

### Knowledge Tracking (BKT)
- **KnowledgeComponent**: Programming concepts (e.g., "arrays", "recursion")
- **BKTState**: Per-user-per-KC mastery probability
- **BKTParameters**: Bayesian model parameters (slip, guess, transition)

### Class Management
- **Class**: Instructor-led course with enrolled students
- **ClassStudent**: Many-to-many join entity for class enrollment
- **ProblemSet**: Curated collection of problems (assignments)
- **ProblemSetItem**: Ordered problems within a problem set

## Key Design Patterns

### 1. Aggregate Roots
- **User**: Root for user-related data (submissions, BKT states)
- **Problem**: Root for problem-related data (test cases)
- **Class**: Root for class-related data (enrollments, problem sets)

### 2. Value Objects
- **BKTParameters**: Immutable configuration for BKT calculations
- **Difficulty**: Enumeration ensuring valid values
- **UserRole**: Enumeration for type safety

### 3. Repository Pattern
Each aggregate root has a corresponding repository:
- `UserRepository`
- `ProblemRepository`
- `SubmissionRepository`
- `ClassRepository`

### 4. Domain Events (Implicit)
- `SubmissionCreated` → Trigger code execution
- `SubmissionGraded` → Update BKT states
- `ErrorDetected` → Classify error
- `ProblemCreated` → Sync knowledge components

## Constraints and Invariants

### Database Constraints
- `User.email`: Unique
- `KnowledgeComponent.name`: Unique
- `BKTState(userId, kcId)`: Composite unique
- `ClassStudent(classId, studentId)`: Composite unique
- `ProblemSetItem.order`: Unique within problem set

### Business Rules
- `BKTState.pKnown`: 0.0 ≤ pKnown ≤ 1.0
- `Problem.acceptanceRate`: 0.0 ≤ rate ≤ 100.0
- `TestCase.points`: points > 0
- `User.role`: Must be valid UserRole
- `Submission.status`: Must be valid SubmissionStatus

### Cascading Deletes
- Delete Problem → Delete TestCases
- Delete Submission → Delete SubmissionError
- Delete Class → Delete ClassStudent, ProblemSet
- Delete ProblemSet → Delete ProblemSetItem
