const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { connectDB } = require("./config/db");
const landRoutes = require("./routes/land.routes");
const mediaRoutes = require("./routes/media.routes");
const flatRoutes = require("./routes/flat.routes");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/lands", landRoutes);
app.use("/api/flats", flatRoutes);
app.use("/api/media", mediaRoutes);
app.use("/uploads", express.static("uploads"));

// Connect DB and start server
connectDB()
  .then(() => {
    app.listen(port, () => console.log(`🚀 Server running on port ${port}!`));
  })
  .catch((err) => console.error("❌ Failed to connect to DB:", err));

app.get("/", (req, res) => res.send("Server is Running!"));
