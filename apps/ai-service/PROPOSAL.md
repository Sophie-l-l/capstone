# Proposal: Cognitive + Affective Analyses for ai-service

Purpose
- Short feasibility review and a  proposal. It maps the capabilities in part 2 System Architecture & Core Functionalities into concrete services to add to `apps/ai-service`, lists data and engineering needs, privacy risks, an MVP plan, and suggested evaluation experiments.

Summary of ideas 
- Core cognitive modeling: Bayesian Knowledge Tracing (BKT) with online updates for each KC, Deep Knowledge Tracing (DKT) for complex temporal patterns, and IRT for global difficulty/ability estimates.
- Affective sensing: multimodal emotion recognition (face AUs, gaze, keystroke/behavior features, optional voice) to detect frustration/confusion/boredom in real time.
- Cognitive load estimation and intervention policy: fuse affect + BKT to detect overload vs underload and select targeted micro-interventions (worked example, hint, prerequisite review, skip-ahead).
- Misconception detection: map common error patterns (AST + error message parsing + test failure profiles) to KC-level misconceptions and trigger specific remediations.
- Integration / orchestration: backend supplies data to `ai-service` endpoints; ai-service returns diagnosis, pKnown updates, and intervention recommendations.

Feasibility assessment (high-level)
- BKT (high feasibility): lightweight, interpretable, works with single-KC or per-KC signals. Requires per-submission correctness and timestamp. Implementation: simple EM or parameterized online update; low compute.
- DKT (medium feasibility): improves modeling of complex temporal dependencies and multiple KCs per problem. Requires historical submission sequences and training (GPU optional for scale). Implementation: LSTM/Transformer model; higher engineering cost.
- IRT (medium): useful for global difficulty/ability calibration. Batch training required; incremental updates possible. Requires many users/problems for stable estimates.
- Multimodal emotion recognition (low-to-medium feasibility technically; high privacy/ops cost): can be built with OpenFace (face AUs), gaze tracking, and lightweight classifiers. Requires labeled data for good accuracy; hardware variability (webcam) reduces reliability; needs strong consent and storage policies.
- Cognitive load estimation (rule-based + ML hybrid): feasible if you combine simple behavioral signals (long fixations, high compile-run rate) with emotion cues. Pure physiological measures increase complexity.
- Misconception detection (medium feasibility): AST-based pattern matching for known misconceptions is feasible; generalized detection requires labeled error->misconception mapping and more advanced pattern mining.
- Plagiarism detection / code similarity (feasible but policy-heavy): many open algorithms (MOSS, AST similarity, embeddings) exist; privacy and false positives require review and manual workflow.

Data requirements (minimal to full)
- Minimal MVP (BKT + simple interventions): submission records (userId, problemId, correctness, timestamp), problem→KC tags, test case results.
- Add-on (misconceptions + cognitive load): code text, stderr/compile messages, runtime data, editor activity logs (keystroke, run frequency), optionally gaze/facial features.
- Full multimodal (research-grade): webcam video frames (or extracted AUs/gaze), microphone audio features, synchronized timestamps to submission events — needs consent and secure storage.

Privacy / Ethics & compliance
- Treat code submissions and biometric signals as sensitive data. Require explicit consent before collecting video/audio. Prefer client-side feature extraction (e.g., compute AUs in browser and only send AUs, not raw frames) to limit raw data transfer.
- Avoid sending raw student code to third-party ML/LLM providers. If using external services, record consent and use data minimization.
- Design human-in-the-loop safeguards: surface suspicious findings to instructors before punitive action; provide appeal paths for plagiarism or emotion-based interventions.

Proposed MVP (practical, low-risk path)
1) BKT online updates endpoint (server-driven): `/bkt/update` — accepts event { userId, kcId, correct, timestamp } and returns new pKnown. Implement EM/online update; store results in DB via backend.
2) Intervention policy engine (rule-based) in ai-service: `/intervene/decide` — inputs: pKnowns, recent error patterns, optional behavioral heuristics; output: recommended action (hint/video/skip/mini-exercise) and rationale.
3) Misconception signature matcher: simple AST/error regex rules packaged as `/misconception/check` — returns probable misconceptions with confidence.
4) Judge0 calibrator: `/judge0/calibrate` — compute p95 runtime and recommend time limit multiplier. Low effort, high ROI.

Why this MVP?
- Minimal new data (submissions + KC tags + test results) are already available.
- Rule-based intervention + BKT yields immediate pedagogical value without needing large labeled datasets or expensive models.
- Adds visible, explainable outputs you can demo to instructors/professors quickly.

APIs / contracts (MVP)
- POST /bkt/update
  Input: { userId, kcId, correct: bool, timestamp }
  Output: { userId, kcId, pKnown, params }  (params optional)

- POST /intervene/decide
  Input: { userId, context: { problemId, kcIds[], pKnowns[], recentErrors[], behaviorMetrics{} } }
  Output: { action: 'hint'|'video'|'review'|'skip'|'none', reason: string, payload?: { hintText|videoUrl|miniExerciseId } }

- POST /misconception/check
  Input: { submissionId, code, stderr, testResults }  (or backend can forward minimal features)
  Output: [{ kcId, misconceptionId, confidence, evidence }]

- POST /judge0/calibrate
  Input: { problemId, runtimes: [{ time, submissionId, testCaseId }] }
  Output: { problemId, p95, suggestedTimeLimitSec, note }

Evaluation metrics / experiments to propose
- BKT correctness: log-likelihood / AUC of predicting future correctness; compare baseline (no BKT) vs BKT vs DKT for held-out sequences.
- Intervention impact: A/B test — measure time to mastery (number of attempts until pKnown crosses threshold), retention, and post-intervention correctness.
- Emotion model: report precision/recall on a small labeled validation set; measure false positives for 'frustration' triggering interruptions.
- Usability: instructor acceptance, perceived usefulness (survey), and rate of manual interventions after automated flags.

Engineering effort & rough timeline (single developer)
- MVP (BKT update + intervention rules + Judge0 calibrator + misconception rules): ~1–2 weeks (prototype)
- DKT/IRT/Mid-term modeling + tests and evaluation: additional 2–4 weeks
- Multimodal emotion detection (research-grade, labeled data + client instrumentation): 4–8+ weeks depending on labeling effort and privacy approval

Risks & mitigations
- False positives on interventions (annoying students): set conservative thresholds and allow opt-out; prefer non-intrusive suggestions first.
- Privacy concerns for video/audio: do client-side feature extraction (AUs, gaze vectors) and send only features; store minimal metadata and purge raw data.
- Data sparsity for IRT/DKT: start with BKT per-KC and accumulate data before heavy modeling.
- Operational cost: DKT training requires hardware; run on CPU for small datasets or use a scheduled batch on GPU for larger training.

---

## Additional analyses & engineering improvements (recommended additions)

Below are complementary analyses and operational capabilities that increase robustness, interpretability, and pedagogical value. Each item includes why it matters, minimal data required, example outputs, and estimated complexity.

1) Uncertainty quantification & calibration (low effort, high value)
- Why: calibrated probabilities reduce risky interventions and help set conservative thresholds.
- Data: model predictions and observed outcomes on a holdout set.
- Output: calibrated probabilities, reliability diagrams, per-user/KC uncertainty measures.
- Complexity: low (Platt scaling, isotonic regression) to medium (Bayesian posterior intervals).

2) Retention / forgetting models (medium)
- Why: schedule reviews and predict when knowledge decays; supports spaced repetition.
- Data: timestamped correctness sequences per KC/user.
- Output: retention curves, suggested review intervals per KC/user.
- Complexity: medium (exponential decay or parametric retention models).

3) Transfer & generalization detection (medium)
- Why: discover knowledge transfer between KCs, inform curriculum design.
- Data: KC-tagged sequences per user.
- Output: transfer matrix A→B with influence scores.

4) Item / test-case analysis (low)
- Why: detect noisy or uninformative test cases; helps judge0 calibration and test quality.
- Data: per-test-case pass rates, runtime, variance across submissions.
- Output: difficulty, discrimination index, flaky-test warnings.

5) Curriculum sequencing optimization (medium)
- Why: recommend next KC/problem sequence to minimize time-to-mastery.
- Data: historical sequences and mastery outcomes.
- Output: suggested next-KC/problem policy (rule-based or learned bandit policy).

6) Dropout / disengagement prediction (low–medium)
- Why: early alerts for students likely to stop participating so instructors can intervene.
- Data: activity logs, submission frequency, pKnown trends.
- Output: drop-risk scores and recommended outreach.

7) Error clustering & canonical fixes (medium)
- Why: aggregate common errors to build targeted micro-lessons and automated hint templates.
- Data: stderr, AST features, failing test inputs.
- Output: clusters of error types with representative fixes and sample evidence.

8) Explainability & instructor-facing rationales (low)
- Why: teachers need human-readable reasons for automated actions.
- Data: model internals and simple feature attributions.
- Output: short rationale strings (e.g., "pKnown dropped 0.25 after 3 attempts on KC X; frequent syntax errors detected").

9) Data quality checks & schema drift alerts (low)
- Why: quickly detect instrumentation bugs (missing fields, malformed KC tags).
- Data: incoming payloads and sample rates.
- Output: alerts and sample bad payloads.

10) Fairness auditing & optional privacy-preserving training (medium to high)
- Why: ensure interventions don't disadvantage groups and protect private signals (video/audio).
- Data: outcomes stratified by permitted demographic metadata (only if policies allow).
- Output: fairness metrics, recommendations; or DP/federated workflows for privacy.

11) Operational tooling: model registry, retraining pipelines, monitoring (medium)
- Why: version models, track performance, and automate retraining when data drifts.
- Data: training metadata and model evaluation logs.
- Output: model registry entries, retrain triggers, monitoring dashboards.

Recommended short-list to add now (priority)
- Uncertainty calibration + item/test-case analysis (low effort, immediate benefit)
- Dropout/disengagement prediction (low–medium)
- Error clustering for misconception canonicalization (medium)
- Explainability module for instructor rationales (low)

Suggested example endpoints to add in `ai-service`
- POST `/model/calibrate_uncertainty` — input: predictions+labels; output: calibration mapping and metrics
- POST `/item/analyze` — input: problemId or test-case runtimes/results; output: difficulty/discrimination
- POST `/student/risk` — input: recent activity/pKnowns; output: drop-risk score
- POST `/errors/cluster` — input: recent failing submissions; output: clusters + representative examples
- GET `/explain/{userId}/{kcId}` — output: human-readable rationale for recommended actions

These additions are designed to be incremental: start with lightweight statistical tooling (calibration, item analysis) before investing in heavier models (DKT, multimodal affect).

Discussion items: 
1. Which analyses are priorities for pedagogical impact in our course — immediate (BKT + intervention) vs research (DKT + multimodal)?
2. Consent and data retention policy for webcam/audio: what is acceptable for pilot studies? Client-side extraction vs raw upload?
3. Which KCs to include in an initial pilot (a curated subset of 10–15 KCs vs the full 40+)?
4. Acceptable intervention modalities (text hint, short video, interactive worked example) and whether students should opt in to automatic interventions.
5. Evaluation design: duration, A/B split, metrics (time-to-mastery, retention, affect reduction), and instructor involvement.
