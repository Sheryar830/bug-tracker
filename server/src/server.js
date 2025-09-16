// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");

// ---- your imports ----
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

// ---------- CORS: allow your frontend(s) ----------
/**
 * Set FRONTEND_URL in Render env to your static site URL, e.g.:
 * FRONTEND_URL=https://bug-tracker-1-m7zv.onrender.com
 */
const FRONTEND_URL = process.env.FRONTEND_URL || "https://bug-tracker-1-m7zv.onrender.com";
const allowedOrigins = new Set([
  "http://localhost:5173",
  FRONTEND_URL,
]);

// If you ever add Netlify/Namecheap/another domain, add it here or via env.
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (!origin || allowedOrigins.has(origin)) {
    // allow this origin
    res.header("Access-Control-Allow-Origin", origin || "*");
    res.header("Vary", "Origin");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  }

  // Short-circuit preflight cleanly
  if (req.method === "OPTIONS") return res.sendStatus(200);

  // If origin exists and is NOT allowed, block with a clear JSON (don’t throw)
  if (origin && !allowedOrigins.has(origin)) {
    return res.status(403).json({ error: "CORS: Origin not allowed" });
  }

  next();
});

// You can still keep the cors() middleware for non-origin logic if you like.
// (Not required, but harmless.)
app.use(cors());

// ---------- Body parsing ----------
app.use(express.json());

// ---------- Health + root ----------
app.get("/", (_req, res) => res.json({ ok: true, service: "bug-tracker-api" }));
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// ---------- DB ----------
connectDB();

// ---------- Routes ----------
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

// Protected demo routes
app.get("/api/me", auth, (req, res) => res.json({ user: req.user }));
app.get("/api/admin-only", auth, allow(ROLES.ADMIN), (_req, res) => res.json({ ok: true }));

// ---------- Fallback 404 ----------
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// ---------- Error handler (keeps JSON consistently) ----------
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Server error" });
});

const port = process.env.PORT || 8000;
app.listen(port, () => console.log(`Server is running on port ${port}`));
