const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");

// GET all lands
async function getAllLands(req, res) {
  try {
    const lands = await getDB().collection("lands").find({}).toArray();
    res.json(lands);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET single land
async function getLandById(req, res) {
  try {
    const land = await getDB()
      .collection("lands")
      .findOne({ _id: new ObjectId(req.params.id) });
    if (!land) return res.status(404).json({ error: "Land not found" });
    res.json(land);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// CREATE new land
async function createLand(req, res) {
  try {
    const newLand = req.body;
    const result = await getDB().collection("lands").insertOne(newLand);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// UPDATE land
async function updateLand(req, res) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid land ID" });
    }

    const updatedLand = req.body;
    const { _id, ...safeData } = updatedLand; // remove _id to avoid conflicts

    // Ensure meta exists
    const updatedMeta = {
      ...(safeData.meta || {}),
      lastUpdatedAt: new Date().toISOString(),
    };

    const updateObj = {
      ...safeData,
      meta: updatedMeta,
    };

    console.log("Updating land with ID:", id);
    console.log("Update object:", updateObj);

    const result = await getDB()
      .collection("lands")
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: updateObj }
      );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Land not found" });
    }

    res.json({ message: "Land updated successfully", result });
  } catch (err) {
    console.error("UpdateLand Error:", {
      message: err.message,
      stack: err.stack,
      requestBody: req.body,
    });
    res.status(500).json({
      error: "Server error while updating land",
      details: err.message,
    });
  }
}


// DELETE land
async function deleteLand(req, res) {
  try {
    const { id } = req.params;
    const result = await getDB()
      .collection("lands")
      .deleteOne({ _id: new ObjectId(id) });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAllLands, createLand, getLandById, updateLand, deleteLand };
