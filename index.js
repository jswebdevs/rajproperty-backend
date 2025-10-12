const express = require("express");
const cors = require("cors");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");

const { connectDB, getDB } = require("./config/db");
const landRoutes = require("./routes/land.routes");
const flatRoutes = require("./routes/flat.routes");
const houseRoutes = require("./routes/house.routes");
const mediaRoutes = require("./routes/media.routes");
const featuredRoutes = require("./routes/featured.routes");
const recentRoutes = require("./routes/recent.routes");
const allRoutes = require("./routes/all.routes");
const draftRoutes = require("./routes/drafts.routes");
const messageRoutes = require("./routes/messages.routes");
const chatRoutes = require("./routes/chat.routes");
const visitorRoutes = require("./routes/visitor.routes");

const app = express();
const port = process.env.PORT || 5000;

// CORS middleware
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      const allowedOrigins = [
        "http://localhost:5173",
        "https://rajpropertyfront.netlify.app",
        "https://www.rajproperty.site",
      ];
      if (allowedOrigins.includes(origin) || /\.netlify\.app$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS: " + origin));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Parse JSON
app.use(express.json());

// Root endpoint
app.get("/", (req, res) => res.send("Server is Running!"));

// Create HTTP server for Socket.IO
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://rajpropertyfront.netlify.app",
      "https://www.rajproperty.site",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Make io accessible in routes/controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use("/api/lands", landRoutes);
app.use("/api/flats", flatRoutes);
app.use("/api/houses", houseRoutes);
app.use("/api/media", mediaRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/featured", featuredRoutes);
app.use("/api/recent", recentRoutes);
app.use("/api/all", allRoutes);
app.use("/api/drafts", draftRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/visitor", visitorRoutes);

// Socket.IO real-time chat
io.on("connection", (socket) => {


  // Listen for new chat messages
  socket.on("send_message", async (data) => {
    try {
      const db = getDB();
      const { sender, email, message } = data;

      if (!email || !sender || !message) return;

      const newMessage = {
        id: new Date().getTime().toString(), // simple id for real-time
        sender,
        message,
        createdAt: new Date(),
      };

      // Save message in MongoDB under visitor
      await db.collection("visitors").updateOne(
        { email },
        { $push: { messages: newMessage } },
        { upsert: true } // create visitor if not exists
      );

      // Broadcast to all clients
      io.emit("receive_message", { email, ...newMessage });
    } catch (err) {
      console.error("Error saving chat message:", err);
    }
  });
});

// Connect DB and start server
connectDB()
  .then(() => {
    server.listen(port, () => console.log(`🚀 Server running on port ${port}!`));
  })
  .catch((err) => console.error("❌ Failed to connect to DB:", err));
