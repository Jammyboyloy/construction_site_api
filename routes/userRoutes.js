const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");
const {
  updateAvatar,
  resetAvatar,
} = require("../controllers/userController");

// ✅ upload / update avatar
router.put(
  "/avatar",
  verifyToken,
  upload.single("avatar"),
  updateAvatar
);

// ✅ reset avatar
router.put(
  "/avatar/reset",
  verifyToken,
  resetAvatar
);

module.exports = router;