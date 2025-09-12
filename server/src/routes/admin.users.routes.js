// routes/admin.users.routes.js
const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const { allow } = require("../middleware/roles");
const { ROLES } = require("../config/constants");
const { listUsers, updateRole, setActiveState } = require("../controllers/user.admin.controller");

router.use(auth, allow(ROLES.ADMIN));

router.get("/", listUsers);
router.patch("/:id/role", updateRole);
router.patch("/:id/state", setActiveState);

module.exports = router;
