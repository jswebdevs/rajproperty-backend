const { getDB } = require("../config/db");

// GET all properties combined
async function getAllProperties(req, res) {
  try {
    const db = getDB();

    // Fetch lands, flats, houses
    const lands = await db.collection("lands").find({}).toArray();
    const flats = await db.collection("flats").find({}).toArray();
    const houses = await db.collection("houses").find({}).toArray();

    // Add type field for each
    const landsWithType = lands.map((l) => ({ ...l, type: "land" }));
    const flatsWithType = flats.map((f) => ({ ...f, type: "flat" }));
    const housesWithType = houses.map((h) => ({ ...h, type: "house" }));

    // Combine all
    const allProperties = [...landsWithType, ...flatsWithType, ...housesWithType];

    res.json(allProperties);
  } catch (err) {
    console.error("Error fetching all properties:", err);
    res.status(500).json({ error: err.message });
  }
}

// Optional: GET recent/latest arrivals (last 10 added)
async function getRecentProperties(req, res) {
  try {
    const db = getDB();

    const lands = await db
      .collection("lands")
      .find({})
      .sort({ "meta.entryDate": -1 })
      .limit(10)
      .toArray();
    const flats = await db
      .collection("flats")
      .find({})
      .sort({ "meta.entryDate": -1 })
      .limit(10)
      .toArray();
    const houses = await db
      .collection("houses")
      .find({})
      .sort({ "meta.entryDate": -1 })
      .limit(10)
      .toArray();

    const allProperties = [
      ...lands.map((l) => ({ ...l, type: "land" })),
      ...flats.map((f) => ({ ...f, type: "flat" })),
      ...houses.map((h) => ({ ...h, type: "house" })),
    ];

    // Sort by entryDate descending again after combining
    allProperties.sort(
      (a, b) => new Date(b.meta.entryDate) - new Date(a.meta.entryDate)
    );

    res.json(allProperties);
  } catch (err) {
    console.error("Error fetching recent properties:", err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAllProperties, getRecentProperties };
