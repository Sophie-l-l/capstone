"use strict";
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const app = express();
// Middleware
app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
// Base health check route
app.get("/health", (_req, res) => res.json({ status: "ok", service: "backend" }));
// Import and use routers
let authRoutes = require("./routes/auth");
let problemRoutes = require("./routes/problems");
let codeExecutionRoutes = require("./routes/codeExecution");
let studentDashboardRoutes = require("./routes/studentDashboard");
let studentSubmissionsRoutes = require("./routes/studentSubmissions");
let studentErrorsRoutes = require("./routes/studentErrors");
// Normalize common export shapes: allow either `module.exports = router` or `module.exports = { router, ... }` or `export default`
const normalizeRouter = (mod) => {
    if (!mod)
        return mod;
    if (mod.default)
        return mod.default;
    if (mod.router)
        return mod.router;
    return mod;
};
authRoutes = normalizeRouter(authRoutes);
problemRoutes = normalizeRouter(problemRoutes);
codeExecutionRoutes = normalizeRouter(codeExecutionRoutes);
studentDashboardRoutes = normalizeRouter(studentDashboardRoutes);
studentSubmissionsRoutes = normalizeRouter(studentSubmissionsRoutes);
studentErrorsRoutes = normalizeRouter(studentErrorsRoutes);
// Minimal diagnostics: ensure routers were loaded
if (!authRoutes || !problemRoutes || !codeExecutionRoutes || !studentDashboardRoutes) {
    console.error('One or more route modules failed to load.');
}
else {
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
}
catch (e) {
    console.error('[diagnostic] error computing callbacks:', e);
}
// Mounting via a small wrapper to ensure Express receives a plain middleware function
// Combine student-related routers so both dashboard and submissions endpoints are available
const studentsCombined = express.Router();
if (studentDashboardRoutes)
    studentsCombined.use(studentDashboardRoutes);
if (studentSubmissionsRoutes)
    studentsCombined.use(studentSubmissionsRoutes);
if (studentErrorsRoutes)
    studentsCombined.use(studentErrorsRoutes);
if (!studentDashboardRoutes && !studentSubmissionsRoutes && !studentErrorsRoutes) {
    console.error('No student routes available to mount under /api/students');
}
else {
    app.use("/api/students", studentsCombined);
}
// 404 handler - must be after all other routes
app.use((_, res) => {
    res.status(404).json({ message: "Route not found" });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ message: "Internal server error" });
});
module.exports = app;
//# sourceMappingURL=app.js.map