const { getDB } = require("../config/db");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath("C:\\ffm\\bin\\ffmpeg.exe");   // Windows path
ffmpeg.setFfprobePath("C:\\ffm\\bin\\ffprobe.exe");
const { ObjectId } = require("mongodb");

// Determine folder type
function getFolderByMime(mime) {
  if (mime.startsWith("image/")) return "img";
  if (mime.startsWith("video/")) return "vid";
  return "docs";
}

// Generate image thumbnail
async function generateImageThumb(filePath, thumbPath) {
  await sharp(filePath).resize(200, 200, { fit: "inside" }).toFile(thumbPath);
}

// Generate video thumbnail
async function generateVideoThumb(filePath, thumbPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .screenshots({
        count: 1,
        folder: path.dirname(thumbPath),    // save in same folder
        filename: path.basename(thumbPath), // exact filename
        size: "320x?",                       // optional
      });
  });
}


// Upload media
async function addMedia(req, res) {
  try {
    const files = req.files;
    if (!files || files.length === 0)
      return res.status(400).json({ error: "No files uploaded" });

    const mediaCollection = getDB().collection("media");
    const mediaDocs = [];

    for (const file of files) {
      const folder = getFolderByMime(file.mimetype);
      const filePath = file.path;
      let thumbUrl = null;

      if (folder === "img") {
        // Image thumbnail
        const thumbPath = path.join(path.dirname(filePath), "thumb-" + file.filename);
        await sharp(filePath).resize(200, 200, { fit: "inside" }).toFile(thumbPath);
        thumbUrl = "/" + path.relative(path.join(__dirname, "../"), thumbPath).replace(/\\/g, "/");

      } else if (folder === "vid") {
        // Video thumbnail
        const thumbFilename = "thumb-" + file.filename + ".png";
        const thumbPath = path.join(path.dirname(filePath), thumbFilename);

        // Generate thumbnail with ffmpeg
        await new Promise((resolve, reject) => {
          ffmpeg(filePath)
            .screenshots({
              count: 1,
              folder: path.dirname(thumbPath),
              filename: path.basename(thumbPath),
              size: "320x?",
            })
            .on("end", resolve)
            .on("error", (err) => {
              console.warn("Video thumbnail failed:", err.message);
              resolve(); // still continue upload
            });
        });

        // Only set thumbUrl if file exists
        if (fs.existsSync(thumbPath)) {
          thumbUrl = "/" + path.relative(path.join(__dirname, "../"), thumbPath).replace(/\\/g, "/");
        }
      }

      // Push media doc
      mediaDocs.push({
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        folder,
        uploadDate: new Date(),
        url: "/" + path.relative(path.join(__dirname, "../uploads"), filePath).replace(/\\/g, "/"),
        thumbUrl,
        title: req.body.title || file.originalname,
        description: req.body.description || "",
        altText: req.body.altText || "",
        tags: req.body.tags ? req.body.tags.split(",") : [],
      });
    }

    const result = await mediaCollection.insertMany(mediaDocs);
    res.status(201).json(result.ops || mediaDocs);
  } catch (err) {
    console.error("Add media error:", err);
    res.status(500).json({ error: err.message });
  }
}


// Get all media with file existence check
async function getAllMedia(req, res) {
  try {
    const { search, type, fromDate, toDate, limit = 20, page = 1 } = req.query;
    const query = {};
    if (search)
      query.$or = [
        { originalName: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    if (type) query.mimeType = { $regex: type };
    if (fromDate) query.uploadDate = { ...query.uploadDate, $gte: new Date(fromDate) };
    if (toDate) query.uploadDate = { ...query.uploadDate, $lte: new Date(toDate) };

    const mediaCollection = getDB().collection("media");

    let media = await mediaCollection
      .find(query)
      .sort({ uploadDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .toArray();

    // Filter out missing files
    media = media.filter((m) => {
      const filePath = path.join(__dirname, "../uploads", m.folder, m.filename);
      return fs.existsSync(filePath);
    });

    const total = await mediaCollection.countDocuments(query);
    res.json({ media, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Get single media by ID
async function getMediaById(req, res) {
  try {
    const { id } = req.params;
    const mediaCollection = getDB().collection("media");
    const media = await mediaCollection.findOne({ _id: new ObjectId(id) });

    if (!media) return res.status(404).json({ error: "Media not found" });

    const filePath = path.join(__dirname, "../uploads", media.folder, media.filename);
    const exists = fs.existsSync(filePath);

    res.json({ ...media, fileExists: exists });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Delete media safely
async function deleteMedia(req, res) {
  try {
    const { id } = req.params;
    const mediaCollection = getDB().collection("media");

    const media = await mediaCollection.findOne({ _id: new ObjectId(id) });
    if (!media) return res.status(404).json({ error: "Media not found" });

    // Delete main file if exists
    try {
      const filePath = path.join(__dirname, "../uploads", media.folder, media.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (err) {
      console.warn("Main file delete failed or missing:", err.message);
    }

    // Delete thumbnail if exists
    try {
      if (media.thumbUrl) {
        const thumbPath = path.join(__dirname, "../", media.thumbUrl);
        if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
      }
    } catch (err) {
      console.warn("Thumbnail delete failed or missing:", err.message);
    }

    // Remove from DB
    await mediaCollection.deleteOne({ _id: new ObjectId(id) });
    res.json({ message: "Media deleted successfully" });
  } catch (err) {
    console.error("Delete media error:", err);
    res.status(500).json({ error: err.message });
  }
}

// Update media metadata
async function updateMedia(req, res) {
  try {
    const { id } = req.params;
    const { title, description, altText, tags } = req.body;
    const mediaCollection = getDB().collection("media");
    const result = await mediaCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { title, description, altText, tags: tags ? tags.split(",") : [] } }
    );
    if (result.matchedCount === 0)
      return res.status(404).json({ error: "Media not found" });
    res.json({ message: "Media updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { addMedia, getAllMedia, getMediaById, updateMedia, deleteMedia };
