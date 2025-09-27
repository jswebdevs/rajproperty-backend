const express = require("express");
const router = express.Router();
const { getAllFlats, createFlat, getFlatById, updateFlat, deleteFlat } = require("../controllers/flats.controller");

// GET all flats
router.get("/", getAllFlats);

// GET single flat by ID
router.get("/:id", getFlatById);

// POST create new flat
router.post("/", createFlat);

// PUT update a flat by ID
router.put("/:id", updateFlat);

// DELETE a flat by ID
router.delete("/:id", deleteFlat);

module.exports = router;
