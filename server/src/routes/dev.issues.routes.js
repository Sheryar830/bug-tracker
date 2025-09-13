const express = require("express");
const router = express.Router();

const { auth } = require("../middleware/auth");
const { allow } = require("../middleware/roles");
const { ROLES } = require("../config/constants");
const { listAssigned, updateMyIssue, myHistory, getMyIssue } = require("../controllers/dev.issues.controller");

router.use(auth, allow(ROLES.DEVELOPER));

router.get("/", listAssigned);
router.get("/history", myHistory);     // <-- NEW
router.patch("/:id", updateMyIssue);
router.get("/:id", getMyIssue);


module.exports = router;
