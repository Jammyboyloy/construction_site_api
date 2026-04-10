const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");
const {
  updateAvatar,
  resetAvatar,
  getMyNotifications,
  markAllNotificationsRead,
  getUnreadCount,
  getMyProjectsController
} = require("../controllers/userController");

// ✅ upload / update avatar
router.put("/avatar", verifyToken, upload.single("avatar"), updateAvatar);

// ✅ reset avatar
router.put("/avatar/reset", verifyToken, resetAvatar);

router.get("/notifications", verifyToken, getMyNotifications);

router.put("/notifications/read-all", verifyToken, markAllNotificationsRead);

router.get("/notifications/unread-count", verifyToken, getUnreadCount);

router.get("/my-projects", verifyToken, getMyProjectsController);

module.exports = router;
