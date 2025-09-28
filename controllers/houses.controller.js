const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");

// GET all houses
async function getAllHouses(req, res) {
  try {
    const houses = await getDB().collection("houses").find({}).toArray();
    res.json(houses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET single House
async function getHouseById(req, res) {
  try {
    const house = await getDB()
      .collection("houses")
      .findOne({ _id: new ObjectId(req.params.id) });
    if (!house) return res.status(404).json({ error: "House not found" });
    res.json(house);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// CREATE new house
async function createHouse(req, res) {
  try {
    const newHouse = req.body;
    const result = await getDB().collection("houses").insertOne(newHouse);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// UPDATE house
async function updateHouse(req, res) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid house ID" });
    }

    const updatedHouse = req.body;
    const { _id, ...safeData } = updatedHouse; // remove _id to avoid conflicts

    // Ensure meta exists
    const updatedMeta = {
      ...(safeData.meta || {}),
      lastUpdatedAt: new Date().toISOString(),
    };

    const updateObj = {
      ...safeData,
      meta: updatedMeta,
    };

    console.log("Updating house with ID:", id);
    console.log("Update object:", updateObj);

    const result = await getDB()
      .collection("houses")
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: updateObj }
      );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "House not found" });
    }

    res.json({ message: "House updated successfully", result });
  } catch (err) {
    console.error("UpdateHouse Error:", {
      message: err.message,
      stack: err.stack,
      requestBody: req.body,
    });
    res.status(500).json({
      error: "Server error while updating house",
      details: err.message,
    });
  }
}


// DELETE house
async function deleteHouse(req, res) {
  try {
    const { id } = req.params;
    const result = await getDB()
      .collection("houses")
      .deleteOne({ _id: new ObjectId(id) });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAllHouses, createHouse, getHouseById, updateHouse, deleteHouse };
