// controllers/admin.settings.controller.js
const Tag = require("../models/tag.model");
const Setting = require("../models/setting.model");

const isDup = (e) => e && (e.code === 11000 || /duplicate key/i.test(e.message || ""));
const asMessage = (e, fallback) => e?.errors
  ? Object.values(e.errors).map(x => x.message).join(", ")
  : e?.message || fallback || "Request failed";

// -------- TAGS ----------
const listTags = async (_req, res) => {
  const items = await Tag.find({}).sort({ name: 1 }).lean();
  res.json(items);
};

const createTag = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const color = String(req.body.color || "#6c757d").trim();

    if (!name) return res.status(400).json({ message: "Tag name is required" });

    const t = await Tag.create({ name, color });
    res.status(201).json(t);
  } catch (e) {
    if (isDup(e)) return res.status(409).json({ message: "Tag name already exists" });
    return res.status(400).json({ message: asMessage(e, "Create failed") });
  }
};

const updateTag = async (req, res) => {
  try {
    const { id } = req.params;
    const patch = {};
    if (req.body.name != null) patch.name = String(req.body.name).trim();
    if (req.body.color != null) patch.color = String(req.body.color).trim();

    const t = await Tag.findByIdAndUpdate(id, { $set: patch }, {
      new: true,
      runValidators: true,
      context: "query",
    });
    if (!t) return res.status(404).json({ message: "Tag not found" });
    res.json(t);
  } catch (e) {
    if (isDup(e)) return res.status(409).json({ message: "Tag name already exists" });
    return res.status(400).json({ message: asMessage(e, "Update failed") });
  }
};

const deleteTag = async (req, res) => {
  try {
    const { id } = req.params;
    const t = await Tag.findByIdAndDelete(id);
    if (!t) return res.status(404).json({ message: "Tag not found" });
    res.json({ ok: true });
  } catch (e) {
    return res.status(400).json({ message: asMessage(e, "Delete failed") });
  }
};

// -------- SLA ----------
const defaultSla = () => ({ Critical: 24, High: 48, Medium: 120, Low: 240 });

const getSla = async (_req, res) => {
  let doc = await Setting.findOne({ key: "sla" }).lean();
  if (!doc) doc = await Setting.create({ key: "sla", value: defaultSla() });
  res.json(doc.value);
};

const updateSla = async (req, res) => {
  try {
    const incoming = req.body || {};
    const next = defaultSla();
    ["Critical", "High", "Medium", "Low"].forEach((k) => {
      const v = Number(incoming[k]);
      if (!Number.isNaN(v) && v >= 0) next[k] = v;
    });
    const doc = await Setting.findOneAndUpdate(
      { key: "sla" },
      { $set: { value: next } },
      { upsert: true, new: true }
    );
    res.json(doc.value);
  } catch (e) {
    return res.status(400).json({ message: asMessage(e, "SLA update failed") });
  }
};

module.exports = {
  listTags,
  createTag,
  updateTag,
  deleteTag,
  getSla,
  updateSla,
};
