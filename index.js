const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { connectDB } = require("./config/db");
const landRoutes = require("./routes/land.routes");
const mediaRoutes = require("./routes/media.routes");
const flatRoutes = require("./routes/flat.routes");
const houseRoutes = require("./routes/house.routes");
const featuredRoutes = require("./routes/featured.routes");
const recentRoutes = require("./routes/recent.routes");
const allRoutes = require("./routes/all.routes");

const app = express();
const port = process.env.PORT || 5000;

// Flexible CORS middleware
const allowedOrigins = [
  "http://localhost:5173",
  "https://rajpropertyfront.netlify.app",
  "https://www.rajproperty.site"
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like Postman or server-to-server)
    if (!origin) return callback(null, true);

    // Remove trailing slash if present
    const cleanOrigin = origin.replace(/\/$/, "");

    // Allow localhost, your main site, or any Netlify subdomain
    if (
      allowedOrigins.includes(cleanOrigin) ||
      /\.netlify\.app$/.test(cleanOrigin)
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS: " + origin));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// Parse JSON
app.use(express.json());

// Routes
app.use("/api/lands", landRoutes);
app.use("/api/flats", flatRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/houses", houseRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/featured", featuredRoutes);
app.use("/api/recent", recentRoutes);
app.use("/api/all", allRoutes);

// Root endpoint
app.get("/", (req, res) => res.send("Server is Running!"));

// Connect DB and start server
connectDB()
  .then(() => {
    app.listen(port, () => console.log(`🚀 Server running on port ${port}!`));
  })
  .catch((err) => console.error("❌ Failed to connect to DB:", err));
