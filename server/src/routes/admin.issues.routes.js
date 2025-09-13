// routes/admin.issues.routes.js
const express = require("express");
const router = express.Router();

const { auth } = require("../middleware/auth");
const { allow } = require("../middleware/roles");
const { ROLES } = require("../config/constants");
const { listIssues, updateIssue, bulkUpdate, removeIssue, getIssue } = require("../controllers/admin.issues.controller");

router.use(auth, allow(ROLES.ADMIN));

router.get("/", listIssues);               // list with filters + pagination
router.patch("/:id", updateIssue);         // single update
router.post("/bulk", bulkUpdate);          // bulk update
router.delete("/:id", removeIssue); 
router.get("/:id", getIssue);
module.exports = router;
