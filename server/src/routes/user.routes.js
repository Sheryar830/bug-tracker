const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const { getMe, updateMe, changePassword } = require("../controllers/user.controller");

router.get("/me", auth, getMe);
router.patch("/me", auth, updateMe);
router.patch("/me/password", auth, changePassword);

module.exports = router;