const express = require("express");
const router = express.Router();
const { getAllHouses, createHouse, getHouseById, updateHouse, deleteHouse } = require("../controllers/houses.controller");

// GET all houses
router.get("/", getAllHouses);

// GET single house by ID
router.get("/:id", getHouseById);

// POST create new house
router.post("/", createHouse);

// PUT update a house by ID
router.put("/:id", updateHouse);

// DELETE a house by ID
router.delete("/:id", deleteHouse);

module.exports = router;
