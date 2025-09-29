const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { connectDB } = require("./config/db");
const landRoutes = require("./routes/land.routes");
const mediaRoutes = require("./routes/media.routes");
const flatRoutes = require("./routes/flat.routes");
const houseRoutes = require("./routes/house.routes");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "https://rajpropertyfront.netlify.app/", "https://www.rajproperty.site"], // allow frontend URLs
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

// Routes
app.use("/api/lands", landRoutes);
app.use("/api/flats", flatRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/houses", houseRoutes);
app.use("/uploads", express.static("uploads"));

// Connect DB and start server
connectDB()
  .then(() => {
    app.listen(port, () => console.log(`🚀 Server running on port ${port}!`));
  })
  .catch((err) => console.error("❌ Failed to connect to DB:", err));

app.get("/", (req, res) => res.send("Server is Running!"));
