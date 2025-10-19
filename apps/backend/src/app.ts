const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
import type { Request, Response } from "express";
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
app.get("/health", (_: Request, res: Response) => res.json({ status: "ok", service: "backend" }));

// Import and use routers
const authRoutes = require("./routes/auth");
const problemRoutes = require("./routes/problems");
const codeExecutionRoutes = require("./routes/codeExecution");

// API Routes
app.use("/api/auth", authRoutes.router);
app.use("/api/problems", problemRoutes);

// Code execution routes are nested under problems
app.use("/api/problems", codeExecutionRoutes);

// 404 handler - must be after all other routes
app.use((_: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

module.exports = app;
