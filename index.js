const express = require("express");
const cors = require("cors");
require("dotenv").config();
const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { Server } = require("socket.io");
const { connectDB, getDB } = require("./config/db");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ROUTES
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
const port = process.env.PORT || 443;

const allowedOrigins = [
  "http://localhost:5173",
  "https://rajpropertyfront.netlify.app",
  "https://www.rajproperty.site",
  "https://rajproperty.site",
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// STATIC UPLOADS
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ROOT ROUTE
app.get("/", (req, res) => {
  res.send("🚀 RajProperty Backend is Running Securely!");
});

// HTTPS OR HTTP SERVER
let server;
let usingHTTPS = false;
try {
  const sslOptions = {
    key: fs.readFileSync("/etc/letsencrypt/live/backend.rajproperty.site/privkey.pem"),
    cert: fs.readFileSync("/etc/letsencrypt/live/backend.rajproperty.site/fullchain.pem"),
  };
  server = https.createServer(sslOptions, app);
  usingHTTPS = true;
  console.log("✅ Using HTTPS (production)");
} catch (err) {
  console.log("⚙️ SSL not found, using HTTP (development)");
  server = http.createServer(app);
}

// SOCKET.IO
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "DELETE"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

// ROUTES
app.use("/api/lands", landRoutes);
app.use("/api/flats", flatRoutes);
app.use("/api/houses", houseRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/featured", featuredRoutes);
app.use("/api/recent", recentRoutes);
app.use("/api/all", allRoutes);
app.use("/api/drafts", draftRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/visitor", visitorRoutes);

// Gemini AI utility
async function getGeminiReply(prompt) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.VITE_GeminiAI);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.error("❌ Gemini API Error:", err);
    return "Sorry, I couldn't respond. Please try again later.";
  }
}

// SOCKET EVENTS
io.on("connection", (socket) => {
  console.log("✅ Socket connected:", socket.id);

  socket.on("send_message", async (data) => {
    try {
      const db = getDB();
      const { sender, email, message } = data;
      if (!email || !sender || !message) return;

      // Save user message
      const newMessage = {
        id: new Date().getTime().toString(),
        sender,
        message,
        createdAt: new Date(),
      };

      await db.collection("visitors").updateOne(
        { email },
        { $push: { messages: newMessage } },
        { upsert: true }
      );

      io.emit("receive_message", { email, ...newMessage });

      // AI bot reply if sender is 'user'
      if (sender.toLowerCase() === "user") {
        const botReplyText = await getGeminiReply(message);

        const botMessage = {
          id: new Date().getTime().toString() + "_bot",
          sender: "bot",
          message: botReplyText,
          createdAt: new Date(),
        };

        await db.collection("visitors").updateOne(
          { email },
          { $push: { messages: botMessage } },
          { upsert: true }
        );
        io.emit("receive_message", { email, ...botMessage });
      }
    } catch (err) {
      console.error("❌ Error saving chat message:", err);
    }
  });

  // Listen for conversation deletion (optional, but recommended!)
  socket.on("delete_conversation", async (data) => {
    try {
      const db = getDB();
      const { email } = data;
      if (!email) return;

      await db.collection("visitors").updateOne(
        { email },
        { $set: { messages: [] } }
      );

      io.emit("conversation_deleted", { email });
    } catch (err) {
      console.error("❌ Error deleting conversation:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

// START SERVER
connectDB()
  .then(() => {
    server.listen(port, () => {
      console.log(`🚀 ${usingHTTPS ? "Secure (HTTPS)" : "Local (HTTP)"} server running on port ${port}!`);
    });
  })
  .catch((err) => console.error("❌ Failed to connect to DB:", err));
