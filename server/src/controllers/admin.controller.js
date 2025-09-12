// controllers/admin.controller.js
const Issue = require("../models/issue.model");
const Project = require("../models/project.model");

const OPEN_STATUSES = ["NEW", "OPEN", "IN_PROGRESS", "READY_FOR_TEST", "REOPENED"];

const getStats = async (_req, res) => {
  try {
    const now = Date.now();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [totalProjects, totalOpenIssues, newThisWeek, openBySeverity, openByStatus, issuesPerProject, recentIssues] =
      await Promise.all([
        Project.countDocuments({}),
        Issue.countDocuments({ status: { $in: OPEN_STATUSES } }),
        Issue.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
        Issue.aggregate([
          { $match: { status: { $in: OPEN_STATUSES } } },
          { $group: { _id: "$severity", count: { $sum: 1 } } },
          { $project: { _id: 0, severity: "$_id", count: 1 } },
          { $sort: { count: -1 } },
        ]),
        Issue.aggregate([
          { $group: { _id: "$status", count: { $sum: 1 } } },
          { $project: { _id: 0, status: "$_id", count: 1 } },
          { $sort: { count: -1 } },
        ]),
        Issue.aggregate([
          { $group: { _id: "$projectId", count: { $sum: 1 } } },
          {
            $lookup: {
              from: "projects",
              localField: "_id",
              foreignField: "_id",
              as: "project",
            },
          },
          { $unwind: { path: "$project", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 0,
              projectId: "$_id",
              name: { $ifNull: ["$project.name", "Unassigned"] },
              key: "$project.key",
              count: 1,
            },
          },
          { $sort: { count: -1 } },
          { $limit: 15 },
        ]),
        Issue.find({})
          .sort("-createdAt")
          .limit(10)
          .select("title severity status projectId createdAt")
          .populate("projectId", "name key")
          .lean(),
      ]);

    res.json({
      cards: {
        totalProjects,
        totalOpenIssues,
        newThisWeek,
      },
      charts: {
        openBySeverity,   // [{ severity, count }]
        openByStatus,     // [{ status, count }]
        issuesPerProject, // [{ projectId, name, key, count }]
      },
      recentIssues,        // last 10
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

module.exports = { getStats };
