const multer = require("multer");

// Keep files in memory as Buffers so they can be streamed directly to ImageKit
const storage = multer.memoryStorage();

// File filter to allow only valid images and videos/GIFs
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    // Images
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    // Videos
    "video/mp4",
    "video/webm",
    "video/quicktime", // .mov
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file format: ${file.mimetype}. Only JPEG, PNG, WEBP, GIF, and MP4/WEBM are allowed.`
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max limit per file
  },
  fileFilter,
});

module.exports = upload;