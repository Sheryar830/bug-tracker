// controllers/issue.controller.js
const Issue = require("../models/issue.model");

const createIssue = async (req, res) => {
  try {
    const body = req.body;

    const issue = await Issue.create({
      projectId: body.projectId || undefined,
      title: body.title,
      description: body.description,
      steps: body.steps,
      pageUrl: body.pageUrl,
      environment: body.environment,
      severity: body.severity || "Low",
      reporterId: req.user.id,
      attachments: body.attachments,          // setter will normalize
      tags: Array.isArray(body.tags) ? body.tags : [],
    });

    res.status(201).json(issue);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const listIssues = async (req, res) => {
  try {
    const {
      mine,            // '' | 'reported' | 'assigned'
      status,          // NEW | OPEN | ...
      assignee,        // userId
      projectId,       // projectId
      severity,        // Low | Medium | High | Critical
      q,               // text search in title/description/steps/tags
      from,            // ISO date (inclusive)
      to,              // ISO date (inclusive)
      sort = "-createdAt",
      page = 1,
      limit = 10,
      populate = "0",  // '1' to populate reporter/assignee
    } = req.query;

    // Build filter
    const where = {};
    if (mine === "reported") where.reporterId = req.user.id;
    if (mine === "assigned") where.assigneeId = req.user.id;
    if (status) where.status = status;
    if (assignee) where.assigneeId = assignee;
    if (projectId) where.projectId = projectId;
    if (severity) where.severity = severity;

    if (q) {
      const rx = new RegExp(q, "i");
      where.$or = [{ title: rx }, { description: rx }, { steps: rx }, { tags: rx }];
    }

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.$gte = new Date(from);
      if (to) where.createdAt.$lte = new Date(to);
    }

    // Pagination & safe sorting
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const perPage = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
    const allowedSort = new Set([
      "createdAt", "-createdAt",
      "severity", "-severity",
      "priority", "-priority",
      "status", "-status"
    ]);
    const sortBy = allowedSort.has(sort) ? sort : "-createdAt";

    // Query
    let query = Issue.find(where).sort(sortBy).skip((pageNum - 1) * perPage).limit(perPage);
    if (populate === "1") {
      query = query
        .populate("reporterId", "name email")
        .populate("assigneeId", "name email");
    }

    const [items, total] = await Promise.all([
      query.lean(),
      Issue.countDocuments(where),
    ]);

    res.json({
      items,
      total,
      page: pageNum,
      pages: Math.ceil(total / perPage),
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};


const getIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: "Not found" });
    res.json(issue);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const deleteIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: "Not found" });

    const isOwner = String(issue.reporterId) === String(req.user.id);
    const isAdmin = req.user.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "You can delete only your own issues" });
    }

    await issue.deleteOne();
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

module.exports = { createIssue, listIssues, getIssue , deleteIssue};
