const { getDB } = require("../config/db");

// GET recent properties
async function getRecentProperties(req, res) {
  try {
    const db = getDB();

    // Fetch all lands, flats, houses
    const [lands, flats, houses] = await Promise.all([
      db.collection("lands").find({}).toArray(),
      db.collection("flats").find({}).toArray(),
      db.collection("houses").find({}).toArray(),
    ]);

    // Combine all properties
    const allProperties = [...lands, ...flats, ...houses];

    // Sort by entryDate descending (most recent first)
    const recentProperties = allProperties.sort((a, b) => {
      const dateA = new Date(a.meta?.entryDate || 0);
      const dateB = new Date(b.meta?.entryDate || 0);
      return dateB - dateA;
    });

    // Optional: limit to recent 10 items
    const limitedRecent = recentProperties.slice(0, 10);

    res.json(limitedRecent);
  } catch (err) {
    console.error("Error fetching recent properties:", err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getRecentProperties };
