const express = require("express");
const router = express.Router();

const { auth } = require("../middleware/auth");
const Project = require("../models/project.model");

// GET /api/projects/mine  -> projects where current user is a member
router.get("/mine", auth, async (req, res) => {
  try {
    const q = req.user.role === "ADMIN" ? {} : { members: req.user.id };
    const items = await Project.find(q)
      .select("_id name key description url members createdAt") // <- added url
      .sort({ name: 1 })
      .lean();
    res.json(items);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});
module.exports = router;
