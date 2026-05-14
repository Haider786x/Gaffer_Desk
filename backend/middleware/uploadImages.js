const path = require("path");
const fs = require("fs");
const multer = require("multer");

const uploadsRoot = path.join(__dirname, "..", "uploads");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

const imageFilter = (req, file, cb) => {
  const ok = ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype);
  if (ok) cb(null, true);
  else cb(new Error("Only JPEG, PNG, or WebP images are allowed"), false);
};

const teamLogoStorage = multer.memoryStorage();
const playerPhotoStorage = multer.memoryStorage();

const limits = { fileSize: 2 * 1024 * 1024 };

const uploadTeamLogoMiddleware = multer({
  storage: teamLogoStorage,
  limits,
  fileFilter: imageFilter,
}).single("logo");

const uploadPlayerPhotoMiddleware = multer({
  storage: playerPhotoStorage,
  limits,
  fileFilter: imageFilter,
}).single("photo");

module.exports = {
  uploadTeamLogoMiddleware,
  uploadPlayerPhotoMiddleware,
};
