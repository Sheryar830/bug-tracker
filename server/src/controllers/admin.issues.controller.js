// controllers/admin.issues.controller.js
const mongoose = require("mongoose");
const Issue = require("../models/issue.model");
const User = require("../models/User");

const OPEN_STATUSES = ["NEW","OPEN","IN_PROGRESS","READY_FOR_TEST","REOPENED","CLOSED"];
const PRIORITIES = ["P0","P1","P2","P3"];
const SEVERITIES = ["Critical","High","Medium","Low"];

const listIssues = async (req, res) => {
  try {
    const {
      q, status, severity, priority, projectId, assigneeId, reporterId,
      page = 1, limit = 20
    } = req.query;

    const where = {};
    if (q) {
      const rx = new RegExp(q, "i");
      where.$or = [{ title: rx }, { description: rx }, { steps: rx }];
    }
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (priority) where.priority = priority;
    if (projectId) where.projectId = projectId;
    if (assigneeId === "null") where.assigneeId = null;
    else if (assigneeId) where.assigneeId = assigneeId;
    if (reporterId) where.reporterId = reporterId;

    const pg = Math.max(parseInt(page) || 1, 1);
    const lim = Math.min(Math.max(parseInt(limit) || 20, 1), 100);

    const [items, total] = await Promise.all([
      Issue.find(where)
        .sort({ createdAt: -1 })
        .skip((pg - 1) * lim)
        .limit(lim)
        .select("title status severity priority projectId assigneeId reporterId createdAt")
        .populate("projectId", "name key")
        .lean(),
      Issue.countDocuments(where),
    ]);

    res.json({ items, total, page: pg, pages: Math.ceil(total / lim) });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const sanitizePatch = (body) => {
  const patch = {};
  if (body.status && OPEN_STATUSES.includes(body.status)) patch.status = body.status;
  if (body.priority && PRIORITIES.includes(body.priority)) patch.priority = body.priority;
  if (body.severity && SEVERITIES.includes(body.severity)) patch.severity = body.severity;
  if (Object.prototype.hasOwnProperty.call(body, "assigneeId")) {
    patch.assigneeId =
      body.assigneeId === null || body.assigneeId === "" ? undefined :
      mongoose.Types.ObjectId.isValid(body.assigneeId) ? body.assigneeId : undefined;
  }
  if (body.projectId && mongoose.Types.ObjectId.isValid(body.projectId)) patch.projectId = body.projectId;
  if (Array.isArray(body.tags)) patch.tags = body.tags;
  return patch;
};

const updateIssue = async (req, res) => {
  try {
    const patch = sanitizePatch(req.body);
    const updated = await Issue.findByIdAndUpdate(req.params.id, patch, {
      new: true, runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const bulkUpdate = async (req, res) => {
  try {
    const { ids = [], patch: bodyPatch = {} } = req.body || {};
    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ message: "ids[] required" });
    }
    const patch = sanitizePatch(bodyPatch);
    const r = await Issue.updateMany({ _id: { $in: ids } }, { $set: patch });
    res.json({ matched: r.matchedCount ?? r.n, modified: r.modifiedCount ?? r.nModified });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

module.exports = { listIssues, updateIssue, bulkUpdate };
