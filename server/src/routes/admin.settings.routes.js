// routes/admin.settings.routes.js
const express = require("express");
const router = express.Router();

const { auth } = require("../middleware/auth");
const { allow } = require("../middleware/roles");
const { ROLES } = require("../config/constants");
const {
  listTags, createTag, updateTag, deleteTag,
  getSla, updateSla,
} = require("../controllers/admin.settings.controller");

router.use(auth, allow(ROLES.ADMIN));

// Tags
router.get("/tags", listTags);
router.post("/tags", createTag);
router.patch("/tags/:id", updateTag);
router.delete("/tags/:id", deleteTag);

// SLA
router.get("/sla", getSla);
router.patch("/sla", updateSla);

module.exports = router;
