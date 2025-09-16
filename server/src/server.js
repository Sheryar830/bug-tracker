// server/src/server.js
require("dotenv").config();
const express = require("express");

// ---- your imports
const connectDB = require("./config/db");
const issueRoutes = require("./routes/issueroutes");
const userRoutes = require("./routes/user.routes");
const adminRoutes = require("./routes/admin.routes");
const authRoutes = require("./routes/authroutes");
const adminUserRoutes = require("./routes/admin.users.routes");
const adminProjectRoutes = require("./routes/admin.projects.routes");
const adminIssueRoutes = require("./routes/admin.issues.routes");
const adminSettingsRoutes = require("./routes/admin.settings.routes");
const projectsRoutes = require("./routes/projects.routes");
const devIssueRoutes = require("./routes/dev.issues.routes");
const devHistoryRoutes = require("./routes/dev.history.routes");
const { auth } = require("./middleware/auth");
const { allow } = require("./middleware/roles");
const { ROLES } = require("./config/constants");

const app = express();

/**
 * CORS: permissive and Express‑5 safe
 * - Allows any origin (no cookies used)
 * - Always returns CORS headers
 * - Handles preflight without using "OPTIONS *" (which breaks on Express 5)
 */
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");                 // allow all
  res.header("Vary", "Origin");
  res.header("Access-Control-Allow-Methods",
             "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers",
             "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.sendStatus(200);       // preflight OK
  next();
});

// Body parsing
app.use(express.json());

// Health + root
app.get("/", (_req, res) => res.json({ ok: true, service: "bug-tracker-api" }));
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// DB
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/projects", adminProjectRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/issues", adminIssueRoutes);
app.use("/api/admin", adminSettingsRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/dev/issues", devIssueRoutes);
app.use("/api/dev/history", devHistoryRoutes);

// Protected demo
app.get("/api/me", auth, (req, res) => res.json({ user: req.user }));
app.get("/api/admin-only", auth, allow(ROLES.ADMIN), (_req, res) =>
  res.json({ ok: true })
);

// 404 + error handler
app.use((req, res) => res.status(404).json({ error: "Not found" }));
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Server error" });
});

const port = process.env.PORT || 8000;
app.listen(port, () => console.log(`Server is running on port ${port}`));
