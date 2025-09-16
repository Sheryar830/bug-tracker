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
const allowedOrigins = [
  "http://localhost:5173", // dev mode
  "https://bug-tracker-1-m7zv.onrender.com", // your Render static frontend
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Optional: handle preflight requests for all routes
app.options("*", cors());app.use(express.json());

// sample route
app.get("/", (_req, res) => res.send("hello my name is shery"));

connectDB();

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



// protected demo routes
app.get("/api/me", auth, (req, res) => res.json({ user: req.user }));
app.get("/api/admin-only", auth, allow(ROLES.ADMIN), (_req, res) => res.json({ ok: true }));

const port = process.env.PORT || 8000;
app.listen(port, () => console.log(`Server is running on port ${port}`));
