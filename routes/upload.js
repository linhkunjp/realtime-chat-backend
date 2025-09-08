const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

// Upload trực tiếp lên Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "Realtime Chat",
    allowed_formats: ["jpg", "png", "jpeg", "gif", "webp"],
  },
});

const upload = multer({ storage });

// Upload nhiều ảnh
router.post("/upload", upload.array("images", 10), (req, res) => {
  try {
    const urls = req.files.map((file) => file.path); // Link public từ Cloudinary trả về
    res.json({ success: true, urls });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
