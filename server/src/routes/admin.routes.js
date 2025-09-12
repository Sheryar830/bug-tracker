// routes/admin.routes.js
const express = require("express");
const router = express.Router();

const { auth } = require("../middleware/auth");
const { allow } = require("../middleware/roles");
const { ROLES } = require("../config/constants");
const { getStats } = require("../controllers/admin.controller");

// Admin-only stats
router.get("/stats", auth, allow(ROLES.ADMIN), getStats);

module.exports = router;
