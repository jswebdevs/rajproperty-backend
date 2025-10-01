const { getDB } = require("../config/db");

// GET all featured properties
async function getFeaturedProperties(req, res) {
  try {
    const db = getDB();

    // Fetch featured lands, flats, houses
    const [lands, flats, houses] = await Promise.all([
      db.collection("lands").find({ "meta.tags": "featured" }).toArray(),
      db.collection("flats").find({ "meta.tags": "featured" }).toArray(),
      db.collection("houses").find({ "meta.tags": "featured" }).toArray(),
    ]);

    // Combine and sort by newest first (optional)
    const allFeatured = [...lands, ...flats, ...houses].sort(
      (a, b) => new Date(b.meta?.entryDate) - new Date(a.meta?.entryDate)
    );

    res.json(allFeatured);
  } catch (err) {
    console.error("Error fetching featured properties:", err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getFeaturedProperties };
