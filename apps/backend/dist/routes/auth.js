"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const client_1 = require("@prisma/client");
const router = express.Router();
const prisma = new client_1.PrismaClient();
// Register endpoint
router.post("/register", async (req, res) => {
    try {
        const { email, password, name, role } = req.body;
        // Validate input
        if (!email || !password || !name || !role) {
            return res.status(400).json({ message: "All fields are required" });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }
        if (!["student", "instructor"].includes(role)) {
            return res.status(400).json({ message: "Role must be either 'student' or 'instructor'" });
        }
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists" });
        }
        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);
        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                username: name,
                passwordHash,
                role,
                name
            },
            select: {
                id: true,
                email: true,
                username: true,
                name: true,
                role: true,
                createdAt: true,
                avatar: true
            }
        });
        // Generate JWT token
        const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.status(201).json({
            message: "User created successfully",
            user,
            token
        });
    }
    catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
// Login endpoint
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
        // Find user
        const user = await prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        // Generate JWT token
        const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
        // Return user without password hash
        const { passwordHash, ...userWithoutPassword } = user;
        res.json({
            message: "Login successful",
            user: userWithoutPassword,
            token
        });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
// Get current user endpoint
router.get("/me", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                username: true,
                name: true,
                role: true,
                createdAt: true,
                avatar: true,
                bio: true,
                location: true,
                githubUrl: true,
                linkedinUrl: true
            }
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ user });
    }
    catch (error) {
        console.error("Get user error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
// Logout endpoint
router.post("/logout", authenticateToken, async (req, res) => {
    // In a more robust implementation, you might maintain a blacklist of tokens
    // For now, we just return success and let the client handle token removal
    res.json({ message: "Logout successful" });
});
// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: "Access token required" });
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: "Invalid or expired token" });
        }
        req.user = user;
        next();
    });
}
// Export both router and middleware
module.exports = { router, authenticateToken };
//# sourceMappingURL=auth.js.map