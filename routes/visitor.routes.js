const express = require("express");
const router = express.Router();
const { addVisitor, getVisitors, deleteVisitor } = require("../controllers/visitors.controller");

// POST /api/visitor -> Add new visitor
router.post("/", addVisitor);

// GET /api/visitor -> Get all visitors
router.get("/", getVisitors);

// DELETE /api/visitor/:email -> Delete visitor by email
router.delete("/:email", deleteVisitor);

module.exports = router;
