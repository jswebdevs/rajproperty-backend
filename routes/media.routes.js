const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { addMedia, getAllMedia, updateMedia, deleteMedia, getMediaById } = require("../controllers/media.controller");

// Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = "uploads/docs";
    if (file.mimetype.startsWith("image/")) folder = "uploads/img";
    else if (file.mimetype.startsWith("video/")) folder = "uploads/vid";
    cb(null, folder);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const safeName = file.originalname.replace(/\s/g, "_").replace(ext, "");
    cb(null, Date.now() + "-" + safeName + ext);
  },
});

const upload = multer({ storage, limits: { fileSize: 1024 * 1024 * 1024 } }); // 1024MB max

// Routes
router.post("/upload", upload.array("media", 20), addMedia);
router.get("/", getAllMedia);
router.put("/:id", updateMedia);
router.get("/:id", getMediaById);
router.delete("/:id", deleteMedia);

module.exports = router;