const { MongoClient, ServerApiVersion } = require("mongodb");

let dbInstance = null;

async function connectDB() {
  if (dbInstance) return dbInstance; // already connected

  const client = new MongoClient(process.env.MONGO_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  await client.connect();
  console.log("✅ Connected to MongoDB!");
  dbInstance = client.db("rajproperty");
  return dbInstance;
}

function getDB() {
  if (!dbInstance) throw new Error("Database not initialized. Call connectDB() first.");
  return dbInstance;
}

module.exports = { connectDB, getDB };
