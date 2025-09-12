// routes/issue.routes.js
const express = require("express");
const router = express.Router();

const { auth } = require("../middleware/auth");
const { createIssue, listIssues, getIssue , deleteIssue } = require("../controllers/issue.controller");

router.post("/", auth, createIssue);   // create
router.get("/", auth, listIssues);     // list with filters
router.get("/:id", auth, getIssue);    // get by id
router.delete("/:id", auth, deleteIssue); 

module.exports = router;
