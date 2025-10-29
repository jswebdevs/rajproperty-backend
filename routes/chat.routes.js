const express = require("express");
const router = express.Router();
const {
  addMessage,
  getMessages,
  getAllChats,
  deleteConversation,
} = require("../controllers/chats.controller");

// Add a new chat message
router.post("/", addMessage);

// Get all messages for a specific visitor
router.get("/:email", getMessages);

// Get all chats (all visitors with messages)
router.get("/", getAllChats);

// Delete all messages for a specific visitor
router.delete("/:email", deleteConversation);

module.exports = router;
