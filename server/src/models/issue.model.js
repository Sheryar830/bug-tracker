// models/issue.model.js
const mongoose = require("mongoose");

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
    tags: [String],
  },
  {
    timestamps: true,
    toJSON: { getters: true },   // ensure getter runs in res.json
    toObject: { getters: true },
  }
);

// Avoid OverwriteModelError in dev hot reloads
module.exports = mongoose.models.Issue || mongoose.model("Issue", IssueSchema);
