const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (req.baseUrl.includes("admin") && req.path.includes("thumbnail")) {
      cb(null, "uploads/projects/");
    } else if (req.path.includes("task-report")) {
      cb(null, "uploads/reports/");
    } else if (req.baseUrl.includes("materials")) { 
      cb(null, "uploads/materials/");
    } else {
      cb(null, "uploads/avatars/");
    }
  },

  // 🔥 YOU MISSED THIS PART
  filename: (req, file, cb) => {
    let ext = path.extname(file.originalname);

    // ✅ fallback if missing extension
    if (!ext) {
      if (file.mimetype === "image/jpeg") ext = ".jpg";
      else if (file.mimetype === "image/png") ext = ".png";
      else ext = ".png";
    }

    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;

    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only images allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1 * 1024 * 1024 },
});

module.exports = upload;