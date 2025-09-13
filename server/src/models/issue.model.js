// models/issue.model.js
const mongoose = require("mongoose");

/* -------------------- Attachments -------------------- */

const AttachmentSchema = new mongoose.Schema(
  {
    url: String,
    name: String,
    type: String,
    size: Number,
  },
  { _id: false }
);

// normalize incoming values (runs on create/update)
function normalizeAttachments(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((a) =>
      typeof a === "string"
        ? { url: a, name: a }
        : { url: a?.url, name: a?.name || a?.url, type: a?.type, size: a?.size }
    )
    .filter((a) => !!a.url);
}

// map older string-only records to objects on read/json
function mapOldAttachments(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((a) => (typeof a === "string" ? { url: a, name: a } : a));
}

/* -------------------- History trail -------------------- */

const IssueHistorySchema = new mongoose.Schema(
  {
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // who made the change
    action: {
      type: String,
      enum: ["status_change", "unassign"],
      required: true,
    },
    from: String,             // previous status (for status_change)
    to: String,               // new status (for status_change)
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

/* -------------------- Issue schema -------------------- */

const IssueSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: false },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    steps: { type: String, default: "" },
    pageUrl: { type: String, default: "" },
    environment: { type: String, default: "" }, // OS/Browser/App version
    severity: { type: String, enum: ["Critical", "High", "Medium", "Low"], default: "Low" },
    priority: { type: String, enum: ["P0", "P1", "P2", "P3"], default: "P3" },
    status: {
      type: String,
      enum: ["NEW", "OPEN", "IN_PROGRESS", "READY_FOR_TEST", "CLOSED", "REOPENED"],
      default: "NEW",
    },
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assigneeId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    attachments: {
      type: [AttachmentSchema],
      default: [],
      set: normalizeAttachments,
      get: mapOldAttachments,
    },

    tags: { type: [String], default: [] },

    // NEW: audit trail entries (used by /dev/history and general auditing)
    history: { type: [IssueHistorySchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

/* -------------------- Indexes (speed up common queries) -------------------- */

// list & filter
IssueSchema.index({ createdAt: -1 });
IssueSchema.index({ projectId: 1, createdAt: -1 });
IssueSchema.index({ assigneeId: 1, createdAt: -1 });
IssueSchema.index({ reporterId: 1, createdAt: -1 });
IssueSchema.index({ status: 1, createdAt: -1 });

// developer history feed
IssueSchema.index({ "history.by": 1, "history.at": -1 });

// optional text search across title/description/steps
IssueSchema.index({ title: "text", description: "text", steps: "text" });

/* -------------------- Export -------------------- */

module.exports =
  mongoose.models.Issue || mongoose.model("Issue", IssueSchema);
