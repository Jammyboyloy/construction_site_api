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
  getMyProjectsController,
  changePasswordController,
  forgotPassword,
  verifyOtp,
  resetPassword,
  resendOtp
} = require("../controllers/userController");

// ✅ upload / update avatar
router.put("/avatar", verifyToken, upload.single("avatar"), updateAvatar);

// ✅ reset avatar
router.put("/avatar/reset", verifyToken, resetAvatar);

router.get("/notifications", verifyToken, getMyNotifications);

router.put("/notifications/read-all", verifyToken, markAllNotificationsRead);

router.get("/notifications/unread-count", verifyToken, getUnreadCount);

router.get("/my-projects", verifyToken, getMyProjectsController);

router.post("/change-password", verifyToken, changePasswordController);

router.post("/forgot-password", forgotPassword);

router.post("/verify-otp", verifyOtp);

router.post("/reset-password", resetPassword);

router.post("/resend-otp", resendOtp);

module.exports = router;
