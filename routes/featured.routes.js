const express = require("express");
const router = express.Router();
const { getFeaturedProperties } = require("../controllers/featured.controller");

// GET all featured properties
router.get("/", getFeaturedProperties);

module.exports = router;
