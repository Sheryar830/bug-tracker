// routes/admin.projects.routes.js
const express = require("express");
const router = express.Router();

const { auth } = require("../middleware/auth");
const { allow } = require("../middleware/roles");
const { ROLES } = require("../config/constants");
const {
  listProjects, createProject, updateProject, deleteProject,
  addMemberByEmail, removeMember
} = require("../controllers/project.admin.controller");

router.use(auth, allow(ROLES.ADMIN));

router.get("/", listProjects);
router.post("/", createProject);
router.patch("/:id", updateProject);
router.delete("/:id", deleteProject);
router.post("/:id/members", addMemberByEmail);
router.delete("/:id/members/:userId", removeMember);

module.exports = router;
