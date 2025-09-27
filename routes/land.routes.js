const express = require("express");
const router = express.Router();
const { getAllLands, createLand, getLandById, updateLand, deleteLand } = require("../controllers/lands.controller");

// GET all lands
router.get("/", getAllLands);

// GET single land by ID
router.get("/:id", getLandById);

// POST create new land
router.post("/", createLand);

// PUT update a land by ID
router.put("/:id", updateLand);

// DELETE a land by ID
router.delete("/:id", deleteLand);

module.exports = router;
