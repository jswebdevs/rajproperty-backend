const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");

// Create a new visitor if not exists
async function addVisitor(req, res) {
  try {
    const db = getDB();
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    // Check if visitor exists
    const existingVisitor = await db.collection("visitors").findOne({ email });
    if (existingVisitor) {
      return res.status(200).json(existingVisitor);
    }

    const visitorData = {
      _id: new ObjectId(),
      name,
      email,
      messages: [],
      createdAt: new Date(),
    };

    const result = await db.collection("visitors").insertOne(visitorData);

    res.status(201).json({ ...visitorData, _id: result.insertedId });
  } catch (err) {
    console.error("Error in addVisitor:", err);
    res.status(500).json({ error: err.message });
  }
}

// Get all visitors
async function getVisitors(req, res) {
  try {
    const db = getDB();
    const visitors = await db
      .collection("visitors")
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    res.json(visitors);
  } catch (err) {
    console.error("Error in getVisitors:", err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { addVisitor, getVisitors };
