const express = require("express");
const router = express.Router();
const { addVisitor, getVisitors } = require("../controllers/visitors.controller");

// POST /api/visitor -> Add new visitor
router.post("/", addVisitor);

// GET /api/visitor -> Get all visitors
router.get("/", getVisitors);

module.exports = router;
