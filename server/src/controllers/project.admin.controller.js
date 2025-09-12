// controllers/project.admin.controller.js
const Project = require("../models/project.model");
const User = require("../models/User");

// GET /api/admin/projects
const listProjects = async (_req, res) => {
  const items = await Project.find({}).populate("members", "name email role").sort("-createdAt").lean();
  res.json(items);
};

// POST /api/admin/projects  { name, key, description }
// helpers
const normalizeUrl = (u) => {
  if (typeof u !== "string") return undefined;     // don't touch if not provided
  const s = u.trim();
  if (!s) return "";                                // allow clearing the url
  if (/^https?:\/\//i.test(s)) return s;           // already has http/https
  return `https://${s}`;
};

const createProject = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const key = req.body.key?.trim()?.toUpperCase();
    const description = (req.body.description || "").trim();
    const url = normalizeUrl(req.body.url);        // <-- NEW

    const payload = { name, key, description };
    if (url !== undefined) payload.url = url;

    const p = await Project.create(payload);
    res.status(201).json(p);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

// PATCH /api/admin/projects/:id  { name?, key?, description?, url? }
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const patch = {};

    if (req.body.name != null) patch.name = String(req.body.name).trim();
    if (req.body.key != null) patch.key = String(req.body.key).trim().toUpperCase();
    if (req.body.description != null) patch.description = String(req.body.description);
    if (req.body.url !== undefined) patch.url = normalizeUrl(req.body.url); // <-- NEW

    const p = await Project.findByIdAndUpdate(id, patch, {
      new: true,
      runValidators: true,
    });
    if (!p) return res.status(404).json({ message: "Not found" });
    res.json(p);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

// DELETE /api/admin/projects/:id
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const p = await Project.findByIdAndDelete(id);
    if (!p) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

// POST /api/admin/projects/:id/members  { email }
const addMemberByEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const p = await Project.findByIdAndUpdate(
      id,
      { $addToSet: { members: user._id } },
      { new: true }
    ).populate("members", "name email role");
    if (!p) return res.status(404).json({ message: "Project not found" });

    res.json(p);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

// DELETE /api/admin/projects/:id/members/:userId
const removeMember = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const p = await Project.findByIdAndUpdate(
      id,
      { $pull: { members: userId } },
      { new: true }
    ).populate("members", "name email role");
    if (!p) return res.status(404).json({ message: "Project not found" });
    res.json(p);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

module.exports = {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
  addMemberByEmail,
  removeMember,
};
