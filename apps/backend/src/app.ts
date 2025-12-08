const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = express();

// Middleware
app.use(cors({ 
  origin: [
    "http://localhost:3000", 
    "http://localhost:3001",
    // Allow Vercel deployments
    /\.vercel\.app$/,
    // Add your custom domain if you have one
  ],
  credentials: true 
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Base health check route
app.get("/health", (_req: any, res: any) => res.json({ status: "ok", service: "backend" }));

// Import and use routers
let authRoutes: any = require("./routes/auth");
let problemRoutes: any = require("./routes/problems");
let codeExecutionRoutes: any = require("./routes/codeExecution");
let studentDashboardRoutes: any = require("./routes/studentDashboard");
let studentSubmissionsRoutes: any = require("./routes/studentSubmissions");
let studentErrorsRoutes: any = require("./routes/studentErrors");
let recommendationsRoutes: any = require("./routes/recommendations");
let instructorRoutes: any = require("./routes/instructorRoutes");
let classRoutes: any = require("./routes/classes");
let problemSetRoutes: any = require("./routes/problemSets");
let errorsRoutes: any = null;
let devRoutes: any = null;
if (process.env.NODE_ENV !== 'production') {
  try {
    devRoutes = require("./routes/dev");
  } catch (e) {
    console.error('Dev routes not available:', e);
  }
}

// Normalize common export shapes: allow either `module.exports = router` or `module.exports = { router, ... }` or `export default`
const normalizeRouter = (mod: any) => {
  if (!mod) return mod;
  if (mod.default) return mod.default;
  if (mod.router) return mod.router;
  return mod;
};

authRoutes = normalizeRouter(authRoutes);
problemRoutes = normalizeRouter(problemRoutes);
codeExecutionRoutes = normalizeRouter(codeExecutionRoutes);
studentDashboardRoutes = normalizeRouter(studentDashboardRoutes);
studentSubmissionsRoutes = normalizeRouter(studentSubmissionsRoutes);
studentErrorsRoutes = normalizeRouter(studentErrorsRoutes);
recommendationsRoutes = normalizeRouter(recommendationsRoutes);
instructorRoutes = normalizeRouter(instructorRoutes);
classRoutes = normalizeRouter(classRoutes);
problemSetRoutes = normalizeRouter(problemSetRoutes);
errorsRoutes = normalizeRouter(errorsRoutes);
devRoutes = normalizeRouter(devRoutes);

// Minimal diagnostics: ensure routers were loaded
if (!authRoutes || !problemRoutes || !codeExecutionRoutes || !studentDashboardRoutes) {
  console.error('One or more route modules failed to load.');
} else {
  console.error('Route modules loaded.');
}

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/problems", problemRoutes);

// Code execution routes are nested under problems
app.use("/api/problems", codeExecutionRoutes);

// Student dashboard routes (mounted under /api/students)
// Quick runtime sanity check to ensure the required module exported a router
if (!studentDashboardRoutes || (typeof studentDashboardRoutes !== "function" && typeof studentDashboardRoutes.use !== "function" && !studentDashboardRoutes.stack)) {
  console.error("studentDashboardRoutes is not an Express router:", studentDashboardRoutes);
  throw new Error("studentDashboardRoutes must export an Express router (module.exports = router)");
}
// Additional diagnostics: mimic router.use arguments processing to reveal the failing callback
try {
  const slice = Array.prototype.slice;
  const flatten = Array.prototype.flat;
  let handler = studentDashboardRoutes;
  let offset = 0;
  let path = '/';

  if (typeof handler !== 'function') {
    let arg = handler;
    while (Array.isArray(arg) && arg.length !== 0) {
      arg = arg[0];
    }

    if (typeof arg !== 'function') {
      offset = 1;
      path = handler;
    }
  }

  const args = ["/api/students", studentDashboardRoutes];
  const callbacks = flatten.call(slice.call(args, offset), Infinity);
  console.error('[diagnostic] computed callbacks length:', callbacks.length);
  callbacks.forEach((cb, i) => console.error('[diagnostic] callback', i, 'typeof', typeof cb, 'value', cb));
} catch (e) {
  console.error('[diagnostic] error computing callbacks:', e);
}
// Mounting via a small wrapper to ensure Express receives a plain middleware function
// Combine student-related routers so both dashboard and submissions endpoints are available
const studentsCombined = express.Router();
if (studentDashboardRoutes) studentsCombined.use(studentDashboardRoutes);
if (studentSubmissionsRoutes) studentsCombined.use(studentSubmissionsRoutes);
if (studentErrorsRoutes) studentsCombined.use(studentErrorsRoutes);
if (recommendationsRoutes) studentsCombined.use(recommendationsRoutes);

if (!studentDashboardRoutes && !studentSubmissionsRoutes && !studentErrorsRoutes && !recommendationsRoutes) {
  console.error('No student routes available to mount under /api/students');
} else {
  app.use("/api/students", studentsCombined);
}

// Instructor routes
if (instructorRoutes) {
  app.use("/api/instructor", instructorRoutes);
} else {
  console.error('Instructor routes not available');
}

// Class and assignment routes
if (classRoutes) {
  app.use("/api/classes", classRoutes);
} else {
  console.error('Class routes not available');
}

if (problemSetRoutes) {
  app.use("/api/problem-sets", problemSetRoutes);
} else {
  console.error('Problem set routes not available');
}

// Analysis routes (AI-related)
try {
  errorsRoutes = require("./routes/errors");
} catch (e) {
  console.error('Errors analysis routes not available:', e);
}
errorsRoutes = normalizeRouter(errorsRoutes);
if (errorsRoutes) {
  app.use("/api/errors", errorsRoutes);
}

// Dev-only endpoints
if (devRoutes) {
  app.use("/api/dev", devRoutes);
}

// 404 handler - must be after all other routes
app.use((_: any, res: any) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

module.exports = app;
