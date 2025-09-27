const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");

// GET all flats
async function getAllFlats(req, res) {
  try {
    const flats = await getDB().collection("flats").find({}).toArray();
    res.json(flats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET single flat
async function getFlatById(req, res) {
  try {
    const flat = await getDB()
      .collection("flats")
      .findOne({ _id: new ObjectId(req.params.id) });
    if (!flat) return res.status(404).json({ error: "Flat not found" });
    res.json(flat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// CREATE new flat
async function createFlat(req, res) {
  try {
    const newFlat = req.body;
    const result = await getDB().collection("flats").insertOne(newFlat);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// UPDATE flat
async function updateFlat(req, res) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid flat ID" });
    }

    const updatedFlat = req.body;
    const { _id, ...safeData } = updatedFlat; // remove _id to avoid conflicts

    // Ensure meta exists
    const updatedMeta = {
      ...(safeData.meta || {}),
      lastUpdatedAt: new Date().toISOString(),
    };

    const updateObj = {
      ...safeData,
      meta: updatedMeta,
    };

    console.log("Updating flat with ID:", id);
    console.log("Update object:", updateObj);

    const result = await getDB()
      .collection("flats")
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: updateObj }
      );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Flat not found" });
    }

    res.json({ message: "Flat updated successfully", result });
  } catch (err) {
    console.error("UpdateFlat Error:", {
      message: err.message,
      stack: err.stack,
      requestBody: req.body,
    });
    res.status(500).json({
      error: "Server error while updating flat",
      details: err.message,
    });
  }
}


// DELETE flat
async function deleteFlat(req, res) {
  try {
    const { id } = req.params;
    const result = await getDB()
      .collection("flats")
      .deleteOne({ _id: new ObjectId(id) });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAllFlats, createFlat, getFlatById, updateFlat, deleteFlat };
