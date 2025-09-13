const mongoose = require("mongoose");
const Issue = require("../models/issue.model");

const DEV_STATUSES = ["OPEN","IN_PROGRESS","READY_FOR_TEST","REOPENED","CLOSED"];

// GET /api/dev/issues  (assigned to me)  — no changes here except we also select pageUrl & attachments
const listAssigned = async (req, res) => {
  try {
    const { q, status, projectId, page = 1, limit = 20 } = req.query;
    const me = req.user._id || req.user.id;

    const where = { assigneeId: me };
    if (q) {
      const rx = new RegExp(q, "i");
      where.$or = [{ title: rx }, { description: rx }, { steps: rx }];
    }
    if (status) where.status = status;
    if (projectId && mongoose.Types.ObjectId.isValid(projectId)) where.projectId = projectId;

    const pg  = Math.max(parseInt(page) || 1, 1);
    const lim = Math.min(Math.max(parseInt(limit) || 20, 1), 100);

    const [items, total] = await Promise.all([
      Issue.find(where)
        .sort({ createdAt: -1 })
        .skip((pg - 1) * lim)
        .limit(lim)
        .select("title status severity priority projectId reporterId assigneeId createdAt pageUrl attachments")
        .populate("projectId", "name key")
        .lean(),
      Issue.countDocuments(where),
    ]);

    res.json({ items, total, page: pg, pages: Math.ceil(total / lim) });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

// PATCH /api/dev/issues/:id — log history for status change or unassign
const updateMyIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const me = req.user._id || req.user.id;

    const issue = await Issue.findOne({ _id: id, assigneeId: me }).select("status assigneeId");
    if (!issue) return res.status(404).json({ message: "Not found or not assigned to you" });

    const setPatch = {};
    const historyEntries = [];

    if (req.body.status && DEV_STATUSES.includes(req.body.status) && req.body.status !== issue.status) {
      setPatch.status = req.body.status;
      historyEntries.push({
        by: me,
        action: "status_change",
        from: issue.status,
        to: req.body.status,
        at: new Date()
      });
    }

    let unsetPatch = null;
    if (Object.prototype.hasOwnProperty.call(req.body, "assigneeId")) {
      // dev may only unassign themselves
      if (req.body.assigneeId === "" || req.body.assigneeId === null) {
        unsetPatch = { assigneeId: 1 };
        historyEntries.push({
          by: me,
          action: "unassign",
          at: new Date()
        });
      }
    }

    const updateDoc = {};
    if (Object.keys(setPatch).length) updateDoc.$set = setPatch;
    if (unsetPatch) updateDoc.$unset = unsetPatch;
    if (historyEntries.length) updateDoc.$push = { history: { $each: historyEntries } };

    const updated = await Issue.findOneAndUpdate(
      { _id: id, assigneeId: me },
      updateDoc,
      { new: true, runValidators: true }
    );

    res.json(updated);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

// GET /api/dev/history  — list my history entries across issues
const myHistory = async (req, res) => {
  try {
    const me = req.user._id || req.user.id;
    const { page = 1, limit = 20, action = "", projectId = "", q = "" } = req.query;

    const pg  = Math.max(parseInt(page) || 1, 1);
    const lim = Math.min(Math.max(parseInt(limit) || 20, 1), 100);

    const match = [{ "history.by": new mongoose.Types.ObjectId(me) }];
    if (action) match.push({ "history.action": action });
    if (projectId && mongoose.Types.ObjectId.isValid(projectId)) match.push({ projectId: new mongoose.Types.ObjectId(projectId) });
    if (q) match.push({ title: { $regex: q, $options: "i" } });

    const pipeline = [
      { $unwind: "$history" },
      { $match: { $and: match } },
      { $sort: { "history.at": -1 } },
      { $lookup: { from: "projects", localField: "projectId", foreignField: "_id", as: "project" } },
      { $addFields: { project: { $first: "$project" } } },
      {
        $project: {
          _id: 1,
          title: 1,
          pageUrl: 1,
          attachments: 1,
          "project._id": 1,
          "project.key": 1,
          "project.name": 1,
          h: "$history"
        }
      },
      { $skip: (pg - 1) * lim },
      { $limit: lim }
    ];

    const countPipeline = [
      { $unwind: "$history" },
      { $match: { $and: match } },
      { $count: "count" }
    ];

    const [rows, countRes] = await Promise.all([
      Issue.aggregate(pipeline),
      Issue.aggregate(countPipeline)
    ]);

    const total = countRes?.[0]?.count || 0;
    res.json({ items: rows, total, page: pg, pages: Math.ceil(total / lim) });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};


const getMyIssue = async (req, res) => {
  try {
    const me = req.user._id || req.user.id;
    const { id } = req.params;

    const it = await Issue.findOne({ _id: id, assigneeId: me })
      .select(
        "title description steps pageUrl environment severity priority status tags " +
        "projectId assigneeId createdAt updatedAt attachments"
      )
      .populate("projectId", "name key url")
      .lean();

    if (!it) return res.status(404).json({ message: "Not found or not assigned to you" });
    res.json(it);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

module.exports = { listAssigned, updateMyIssue, myHistory, getMyIssue };
