const express = require("express");
const router = express.Router();

const { auth } = require("../middleware/auth");
const { allow } = require("../middleware/roles");
const { ROLES } = require("../config/constants");
const { myHistory } = require("../controllers/dev.issues.controller");

router.use(auth, allow(ROLES.DEVELOPER));
router.get("/", myHistory);

module.exports = router;
