const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
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

dotenv.config();

const app = express();

// allow all during setup; later set to your frontend origin (e.g. https://your-site.netlify.app)
app.use(cors({ origin: process.env.CORS_ORIGIN || "*"}));
app.use(express.json());

// --- Health & root (do NOT require DB) ---
app.get("/", (_req, res) => res.send("hello my name is shery"));
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// --- Lazy DB connect for routes that need it ---
app.use(async (req, res, next) => {
  // allow health/root without DB
  if (req.path === "/" || req.path === "/api/health") return next();

  try {
    await connectDB();               // cached connect (see db.js)
    next();
  } catch (err) {
    console.error("DB connect error:", err?.message);
    return res.status(500).json({ message: "Database connection failed" });
  }
});

// --- API routes ---
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

// --- Protected demo routes ---
app.get("/api/me", auth, (req, res) => res.json({ user: req.user }));
app.get("/api/admin-only", auth, allow(ROLES.ADMIN), (_req, res) => res.json({ ok: true }));

// Export app for serverless (Vercel)
module.exports = app;

// Only listen locally
if (require.main === module) {
  const port = process.env.PORT || 8000;
  app.listen(port, () => console.log(`Server is running on port ${port}`));
}
